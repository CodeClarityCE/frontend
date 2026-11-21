import { beforeEach, describe, expect, it } from "vitest";

import { Entity } from "@/utils/api/BaseEntity";

import { createTestApp } from "../../../../tests/real-app";

import { AuditLog } from "./AuditLog";

function auditLogEntry(action: string, actionClass = "Organization"): object {
  return {
    id: "log-1",
    action_severity: 1,
    action_class: actionClass,
    action,
    description: "Something happened",
    blame_on_email: "john.doe@codeclarity.io",
    created_on: "2026-11-17T10:00:00.000Z",
  };
}

describe("AuditLog", () => {
  // A dropped entry logs a warning, which would otherwise reach the network.
  beforeEach(() => {
    createTestApp();
  });

  it.each([
    "AnalysisStarted",
    "AnalysisDeleted",
    "AnalysisFailed",
    "OrganizationCreated",
    "OrganizationInvitationRevoked",
    "OrganizationIntegrationAdded",
    "OrganizationIntegrationUpdated",
    "OrganizationIntegrationDeleted",
  ])("keeps an audit log entry with action %s", (action) => {
    const logs = Entity.unMarshalMany<AuditLog>(
      [auditLogEntry(action) as AuditLog],
      AuditLog,
    );

    expect(logs.map((log) => log.action)).toEqual([action]);
  });

  it("keeps an audit log entry whose area the API could not classify", () => {
    const logs = Entity.unMarshalMany<AuditLog>(
      [auditLogEntry("ProjectCreate", "Unkown") as AuditLog],
      AuditLog,
    );

    expect(logs).toHaveLength(1);
  });

  it("drops an audit log entry with an action the API never sends", () => {
    const logs = Entity.unMarshalMany<AuditLog>(
      [auditLogEntry("SampleCreate") as AuditLog],
      AuditLog,
    );

    expect(logs).toEqual([]);
  });
});
