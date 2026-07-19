import { prisma } from "../../lib/prisma.js";
import { Severity } from "../../generated/prisma/client.js";
import { CreateWeatherAlertInput, UpdateWeatherAlertInput } from "./weather.schema.js";

export const createWeatherAlertService = async (data: CreateWeatherAlertInput) => {
  const { areaId, alertType, alertTypeMr, message, messageMr, severity, validFrom, validTo, source } = data;

  const area = await prisma.area.findUnique({
    where: { id: BigInt(areaId) },
  });
  if (!area) {
    throw new Error("Area not found.");
  }

  const parsedValidFrom = validFrom ? new Date(validFrom) : new Date();
  const parsedValidTo = validTo ? new Date(validTo) : null;

  const marathiAlertType = alertTypeMr || alertType;
  const marathiMessage = messageMr || message;

  const dbAlertType = JSON.stringify({ en: alertType, mr: marathiAlertType });
  const dbMessage = JSON.stringify({ en: message, mr: marathiMessage });

  return await prisma.$transaction(async (tx) => {
    // 1. Create WeatherAlert
    const alert = await tx.weatherAlert.create({
      data: {
        areaId: BigInt(areaId),
        alertType: dbAlertType,
        message: dbMessage,
        severity: severity || Severity.medium,
        validFrom: parsedValidFrom,
        validTo: parsedValidTo,
        source: source || null,
      },
      include: {
        area: true,
      },
    });

    // 2. Fetch all users registered in this Area
    const users = await tx.user.findMany({
      where: { areaId: BigInt(areaId), isActive: true },
      select: { id: true, languagePref: true },
    });

    // 3. Create Notifications in bulk for all target area users
    if (users.length > 0) {
      await tx.notification.createMany({
        data: users.map((u) => {
          const notifTitle = JSON.stringify({
            en: alertType,
            mr: marathiAlertType
          });
          const notifMsg = JSON.stringify({
            en: message,
            mr: marathiMessage
          });

          return {
            userId: u.id,
            title: notifTitle,
            message: notifMsg,
            type: "weather_alert",
            referenceId: alert.id,
          };
        }),
      });
    }

    return alert;
  }, {
    timeout: 20000
  });
};

export const listWeatherAlertsService = async (filters: {
  areaId?: bigint;
  severity?: Severity;
  activeOnly?: boolean;
}) => {
  const now = new Date();
  const where: any = {
    areaId: filters.areaId ? BigInt(filters.areaId) : undefined,
    severity: filters.severity || undefined,
  };

  if (filters.activeOnly) {
    where.AND = [
      { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
      { OR: [{ validTo: null }, { validTo: { gte: now } }] },
    ];
  }

  return await prisma.weatherAlert.findMany({
    where,
    include: {
      area: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getWeatherAlertByIdService = async (id: bigint) => {
  const alert = await prisma.weatherAlert.findUnique({
    where: { id },
    include: {
      area: true,
    },
  });

  if (!alert) {
    throw new Error("Weather alert not found.");
  }
  return alert;
};

export const updateWeatherAlertService = async (id: bigint, data: UpdateWeatherAlertInput) => {
  const { areaId, alertType, alertTypeMr, message, messageMr, severity, validFrom, validTo, source } = data;

  const existing = await prisma.weatherAlert.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Weather alert not found.");
  }

  if (areaId !== undefined) {
    const area = await prisma.area.findUnique({ where: { id: BigInt(areaId) } });
    if (!area) {
      throw new Error("Target Area not found.");
    }
  }

  let dbAlertType = undefined;
  if (alertType !== undefined && alertType !== null) {
    const marathiType = alertTypeMr || alertType;
    dbAlertType = JSON.stringify({ en: alertType, mr: marathiType });
  }

  let dbMessage = undefined;
  if (message !== undefined && message !== null) {
    const marathiMsg = messageMr || message;
    dbMessage = JSON.stringify({ en: message, mr: marathiMsg });
  }

  return await prisma.weatherAlert.update({
    where: { id },
    data: {
      areaId: areaId !== undefined ? BigInt(areaId) : undefined,
      alertType: dbAlertType !== undefined ? dbAlertType : undefined,
      message: dbMessage !== undefined ? dbMessage : undefined,
      severity: severity !== undefined ? severity : undefined,
      validFrom: validFrom !== undefined ? (validFrom ? new Date(validFrom) : null) : undefined,
      validTo: validTo !== undefined ? (validTo ? new Date(validTo) : null) : undefined,
      source: source !== undefined ? source || null : undefined,
    },
    include: {
      area: true,
    },
  });
};

export const deleteWeatherAlertService = async (id: bigint) => {
  const existing = await prisma.weatherAlert.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Weather alert not found.");
  }

  return await prisma.weatherAlert.delete({
    where: { id },
  });
};
