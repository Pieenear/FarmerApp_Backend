import { prisma } from "../../lib/prisma.js";
import { ReportType, RequestStatus, Role, AvailabilityStatus, Prisma } from "../../generated/prisma/client.js";
import { UploadReportInput, AddSimplifiedReportInput } from "./report.schema.js";
import { analyzeLabReport } from "../detection/ai.service.js";

/**
 * Service to upload a Lab Report (Admin only)
 * This automatically:
 * 1. Validates request matches report type (soil vs water).
 * 2. Creates the Lab Report record.
 * 3. Creates the Simplified Report record (if provided).
 * 4. Completes the service request and logs the status update.
 * 5. Releases the assigned ground staff member (marks them available).
 */
export const uploadReportService = async (data: UploadReportInput, adminId: bigint) => {
  const { requestId, reportType, rawFileUrl, simplified } = data;

  const request = await prisma.serviceRequest.findUnique({
    where: { id: BigInt(requestId) },
    include: { farmer: true }
  });

  if (!request) {
    throw new Error("Service request not found.");
  }

  // Validate report type matches request type
  if (reportType === ReportType.soil && request.requestType !== "soil_testing") {
    throw new Error("Cannot upload a soil report for a non-soil testing request.");
  }
  if (reportType === ReportType.water && request.requestType !== "water_testing") {
    throw new Error("Cannot upload a water report for a non-water testing request.");
  }

  // Verify a report does not already exist
  const existingReport = await prisma.labReport.findFirst({
    where: { requestId: BigInt(requestId) },
  });
  if (existingReport) {
    throw new Error("A lab report has already been uploaded for this request.");
  }

  let finalSimplified = simplified;
  if (!finalSimplified || !finalSimplified.summaryText) {
    const languagePref = (request.farmer as any)?.languagePref || "en";
    try {
      const aiResult = await analyzeLabReport(rawFileUrl, reportType, languagePref);
      finalSimplified = {
        summaryText: aiResult.summaryText,
        healthScore: aiResult.healthScore,
        keyParameters: aiResult.keyParameters,
        recommendations: aiResult.recommendations,
        language: languagePref,
      };
    } catch (err) {
      console.error("AI simplification failed during upload, using fallback:", err);
      finalSimplified = {
        summaryText: "Lab report uploaded. Actionable recommendations are being processed.",
        healthScore: 80,
        keyParameters: {},
        recommendations: "Please consult with ground staff for detailed advice.",
        language: languagePref,
      };
    }
  }

  const previousStatus = request.status;

  return await prisma.$transaction(async (tx) => {
    // 1. Create the Lab Report
    const labReport = await tx.labReport.create({
      data: {
        requestId: BigInt(requestId),
        reportType,
        rawFileUrl,
        uploadedByAdminId: adminId,
        simplifiedReport: finalSimplified
          ? {
              create: {
                summaryText: finalSimplified.summaryText || null,
                healthScore: finalSimplified.healthScore !== undefined ? finalSimplified.healthScore : null,
                keyParameters: finalSimplified.keyParameters ? (finalSimplified.keyParameters as any) : Prisma.DbNull,
                recommendations: finalSimplified.recommendations || null,
                language: finalSimplified.language || "en",
              },
            }
          : undefined,
      },
      include: {
        simplifiedReport: true,
        request: true,
      },
    });

    // 2. Transition the Request to completed status
    await tx.serviceRequest.update({
      where: { id: BigInt(requestId) },
      data: {
        status: RequestStatus.completed,
        completedAt: new Date(),
      },
    });

    // 3. Create status transition audit log
    await tx.requestStatusLog.create({
      data: {
        requestId: BigInt(requestId),
        changedByUserId: adminId,
        previousStatus,
        newStatus: RequestStatus.completed,
        remarks: "Lab report uploaded, request marked as completed.",
      },
    });

    // Create Notification for the farmer
    const reportTypeTitleEn = reportType === ReportType.soil ? "Soil Test Report" : "Water Test Report";
    const reportTypeTitleMr = reportType === ReportType.soil ? "माती चाचणी अहवाल" : "पाणी चाचणी अहवाल";

    const notifTitle = JSON.stringify({
      en: `New Lab Report Available: ${reportTypeTitleEn}`,
      mr: `नवीन लॅब अहवाल उपलब्ध: ${reportTypeTitleMr}`,
    });

    const notifMsg = JSON.stringify({
      en: finalSimplified?.summaryText || "Your lab report is ready for viewing.",
      mr: finalSimplified?.summaryText || "तुमचा लॅब अहवाल पाहण्यासाठी तयार आहे.",
    });

    await tx.notification.create({
      data: {
        userId: request.farmerId,
        title: notifTitle,
        message: notifMsg,
        type: "lab_report",
        referenceId: labReport.id,
      },
    });

    // 4. Release assigned Ground Staff if present
    if (request.assignedStaffId) {
      await tx.groundStaff.update({
        where: { id: request.assignedStaffId },
        data: {
          availabilityStatus: AvailabilityStatus.available,
        },
      });
    }

    return labReport;
  }, {
    timeout: 20000
  });
};

/**
 * Service to add/update a Simplified Report for an existing Lab Report (Admin only)
 */
export const addSimplifiedReportService = async (
  labReportId: bigint,
  data: AddSimplifiedReportInput
) => {
  const labReport = await prisma.labReport.findUnique({
    where: { id: labReportId },
  });
  if (!labReport) {
    throw new Error("Lab Report not found.");
  }

  const { summaryText, healthScore, keyParameters, recommendations, language } = data;

  return await prisma.simplifiedReport.upsert({
    where: { labReportId },
    update: {
      summaryText,
      healthScore: healthScore !== undefined ? healthScore : undefined,
      keyParameters: keyParameters || undefined,
      recommendations: recommendations || undefined,
      language: language || undefined,
    },
    create: {
      labReportId,
      summaryText,
      healthScore: healthScore !== undefined ? healthScore : null,
      keyParameters: keyParameters ? (keyParameters as any) : Prisma.DbNull,
      recommendations: recommendations || null,
      language: language || "en",
    },
  });
};

/**
 * Service to list lab reports (Farmers view only their own requests' reports)
 */
export const getReportListService = async (userId: bigint, userRole: Role) => {
  return await prisma.labReport.findMany({
    where: {
      request: userRole === Role.farmer ? { farmerId: userId } : undefined,
    },
    include: {
      simplifiedReport: true,
      request: true,
      uploadedByAdmin: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: { uploadedAt: "desc" },
  });
};

/**
 * Service to get a single Lab Report by ID with ownership checks
 */
export const getReportByIdService = async (id: bigint, userId: bigint, userRole: Role) => {
  const report = await prisma.labReport.findUnique({
    where: { id },
    include: {
      simplifiedReport: true,
      request: true,
      uploadedByAdmin: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  if (!report) {
    throw new Error("Lab report not found.");
  }

  // Restrict access for farmers to their own requests
  if (userRole === Role.farmer && report.request.farmerId !== userId) {
    throw new Error("Unauthorized access to this report.");
  }

  return report;
};
