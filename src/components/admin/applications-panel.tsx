import { FileText } from "lucide-react";
import { SubmitButton } from "@/components/admin/submit-button";
import { updateProviderApplicationStatus } from "@/app/admin/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusPill, type StatusTone } from "@/components/admin/status-pill";

export type ProviderApplicationRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  specialty: string;
  region: string;
  experienceYears: number | null;
  languages: string[];
  consultationModes: string[];
  bio: string;
  fileName: string;
  fileUrl: string | null;
  status: "new" | "reviewing" | "approved" | "rejected";
  createdAt: string;
};

const statusTone: Record<ProviderApplicationRow["status"], StatusTone> = {
  new: "pending",
  reviewing: "info",
  approved: "positive",
  rejected: "urgent",
};

export function ApplicationsPanel({ applications }: { applications: ProviderApplicationRow[] }) {
  return (
    <div className="rounded-xl border border-border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Applicant</TableHead>
            <TableHead>Specialty</TableHead>
            <TableHead>License</TableHead>
            <TableHead>Modes</TableHead>
            <TableHead>File</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.length > 0 ? (
            applications.map((application) => (
              <TableRow key={application.id} className="align-top">
                <TableCell className="min-w-64 pl-4">
                  <p className="font-semibold text-[#071923]">{application.fullName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{application.email}</p>
                  {application.phone ? (
                    <p className="mt-1 text-xs text-muted-foreground">{application.phone}</p>
                  ) : null}
                  {application.bio ? (
                    <p className="mt-2 line-clamp-2 max-w-sm text-xs leading-5 text-[#60717a]">
                      {application.bio}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="min-w-44">
                  <p className="font-medium">{application.specialty}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {application.region || "Region not set"}
                    {application.experienceYears !== null ? ` / ${application.experienceYears} yrs` : ""}
                  </p>
                </TableCell>
                <TableCell className="text-muted-foreground">{application.licenseNumber}</TableCell>
                <TableCell className="text-muted-foreground">
                  {[...application.languages, ...application.consultationModes].join(", ") || "-"}
                </TableCell>
                <TableCell>
                  {application.fileUrl ? (
                    <a
                      href={application.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f7f4] px-3 py-1.5 text-xs font-bold text-[#087a7b]"
                    >
                      <FileText className="size-3.5" />
                      {application.fileName || "Open file"}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">No file</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusPill tone={statusTone[application.status]}>{application.status}</StatusPill>
                </TableCell>
                <TableCell className="pr-4 text-xs text-muted-foreground">
                  {new Date(application.createdAt).toLocaleDateString("en-TZ", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "Africa/Dar_es_Salaam",
                  })}
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex justify-end gap-1.5">
                    <ApplicationStatusButton id={application.id} status="reviewing" label="Review" />
                    <ApplicationStatusButton id={application.id} status="approved" label="Approve" />
                    <ApplicationStatusButton id={application.id} status="rejected" label="Reject" />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                No doctor applications yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ApplicationStatusButton({
  id,
  status,
  label,
}: {
  id: string;
  status: ProviderApplicationRow["status"];
  label: string;
}) {
  return (
    <form action={updateProviderApplicationStatus}>
      <input type="hidden" name="applicationId" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton
        size="sm"
        variant={status === "rejected" ? "destructive" : status === "approved" ? "default" : "outline"}
        className="h-8 rounded-full px-3 text-xs"
      >
        {label}
      </SubmitButton>
    </form>
  );
}
