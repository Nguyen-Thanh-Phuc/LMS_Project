import mongoose from "mongoose";
import Certificate from "../models/certificate.model.js";
import Enrollment from "../models/enrollment.model.js";
import Course from "../models/course.model.js";
import User from "../models/user.js";
import { ApiError } from "../middleware/errorHandler.js";
import { v4 as uuidv4 } from "uuid";

// Generate certificate
export const generateCertificate = async (req, res, next) => {
  try {
    const { userId: bodyUserId, courseId, score } = req.body;

    const userId =
      req.user?.role === "admin" && bodyUserId
        ? bodyUserId
        : req.user?._id;

    if (!userId || !courseId) {
      return next(new ApiError(400, "UserId and courseId are required"));
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({ userId, courseId });
    if (!enrollment) {
      return next(new ApiError(400, "User is not enrolled in this course"));
    }

    // Check if course is completed
    if (!enrollment.isCompleted) {
      return next(new ApiError(400, "Course must be completed before certificate is issued"));
    }

    // Check if certificate already exists
    const existingCert = await Certificate.findOne({ userId, courseId, status: "issued" });
    if (existingCert) {
      return res.status(200).json({
        success: true,
        message: "Certificate already issued",
        data: existingCert
      });
    }

    const user = await User.findById(userId);
    const course = await Course.findById(courseId);

    if (!user || !course) {
      return next(new ApiError(404, "User or course not found"));
    }

    const certificateId = `CERT-${uuidv4()}`;

    const certificate = await Certificate.create({
      userId,
      courseId,
      certificateId,
      courseName: course.title,
      studentName: user.name,
      completionDate: new Date(),
      score: score || null,
      status: "issued"
    });

    res.status(201).json({
      success: true,
      message: "Certificate generated successfully",
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};

// Get user certificates
export const getUserCertificates = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;
    const certificates = await Certificate.find({ userId })
      .populate("courseId", "title")
      .skip(skip)
      .limit(Number(limit))
      .sort("-completionDate");

    const total = await Certificate.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: certificates,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user's certificate for a specific course
export const getMyCertificateForCourse = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;

    const certificate = await Certificate.findOne({ userId, courseId, status: "issued" })
      .populate("courseId", "title")
      .populate("userId", "name email");

    if (!certificate) {
      return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};

// Get certificate by ID
export const getCertificateById = async (req, res, next) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findById(certificateId)
      .populate("userId", "name email")
      .populate("courseId", "title description");

    if (!certificate) {
      return next(new ApiError(404, "Certificate not found"));
    }

    res.status(200).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};

// Get certificates for a course (admin view)
export const getCourseCertificates = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;
    const certificates = await Certificate.find({ courseId })
      .populate("userId", "name email")
      .skip(skip)
      .limit(Number(limit))
      .sort("-completionDate");

    const total = await Certificate.countDocuments({ courseId });

    res.status(200).json({
      success: true,
      data: certificates,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Verify certificate by ID
export const verifyCertificate = async (req, res, next) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId })
      .populate("userId", "name")
      .populate("courseId", "title");

    if (!certificate) {
      return next(new ApiError(404, "Certificate not found"));
    }

    if (certificate.status !== "issued") {
      return next(new ApiError(400, "Certificate is not valid"));
    }

    res.status(200).json({
      success: true,
      message: "Certificate is valid",
      data: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        completionDate: certificate.completionDate,
        status: certificate.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// Download certificate (PDF generated here)
import PDFDocument from "pdfkit";

export const downloadCertificate = async (req, res, next) => {
  try {
    const { certificateId } = req.params;

    // Mongoose will throw a CastError if certificateId is not a valid ObjectId.
    // Try _id only when the value looks like an ObjectId; otherwise, search by certificateId.
    const isObjectId = mongoose.Types.ObjectId.isValid(certificateId);
    const certificate = isObjectId
      ? await Certificate.findById(certificateId)
          .populate("userId", "name")
          .populate("courseId", "title")
      : null;

    const certificateByCode =
      (await Certificate.findOne({ certificateId })
        .populate("userId", "name")
        .populate("courseId", "title")) ||
      (await Certificate.findOne({ _id: certificateId })
        .populate("userId", "name")
        .populate("courseId", "title"));

    const finalCertificate = certificate || certificateByCode;

    if (!finalCertificate) {
      return next(new ApiError(404, "Certificate not found"));
    }

    // Only allow owner (or admin) to download
    const certificateUserId =
      finalCertificate.userId?._id?.toString() ||
      finalCertificate.userId?.toString();

    if (
      req.user?.role !== "admin" &&
      certificateUserId !== req.user?._id.toString()
    ) {
      return next(new ApiError(403, "Not authorized to download this certificate"));
    }

    // generate a simple PDF using PDFKit
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // set headers so browser treats it as a file download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${finalCertificate.certificateId}.pdf"`
    );

    // pipe PDF to response
    doc.pipe(res);

    doc.fontSize(20).text("Course Completion Certificate", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Certificate ID: ${certificate.certificateId}`);
    doc.text(`Student: ${certificate.studentName}`);
    doc.text(`Course: ${certificate.courseName}`);
    doc.text(`Issued: ${certificate.completionDate.toDateString()}`);

    doc.moveDown(2);
    doc.fontSize(12).text("This is a computer generated certificate.");

    doc.end();
  } catch (error) {
    next(error);
  }
};

// Get certificate statistics (admin dashboard)
export const getCertificateStats = async (req, res, next) => {
  try {
    const totalCertificates = await Certificate.countDocuments({ status: "issued" });
    const revokedCertificates = await Certificate.countDocuments({ status: "revoked" });

    res.status(200).json({
      success: true,
      data: {
        totalCertificatesIssued: totalCertificates,
        revokedCertificates,
        validCertificates: totalCertificates - revokedCertificates
      }
    });
  } catch (error) {
    next(error);
  }
};
