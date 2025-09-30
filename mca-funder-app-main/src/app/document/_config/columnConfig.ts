// Define the columns for the Document table
import { ColumnConfig } from "@/components/GenericList/types";
import { formatTime, formatPhone, renderStatusBadge } from "@/components/GenericList/utils";
import { Document } from "@/types/document";
import { formatFileSize } from "@/lib/api/documents";

export const columns: ColumnConfig<Document>[] = [
  { key: "_id", label: "Document ID" },
  { key: "file_name", label: "File Name" },
  { key: "file_type", label: "File Type" },
  { 
    key: "file_size", 
    label: "File Size",
    render: (value) => value ? formatFileSize(value as number) : 'N/A'
  },
  {
    key: "merchant", 
    label: "Merchant",
    columns: [
      { key: "_id", label: "Merchant ID" },
      { key: "name", label: "Name" },
      { key: "dba_name", label: "DBA Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone", render: formatPhone },
    ],
  },
  {
    key: "funder", 
    label: "Funder",
    columns: [
      { key: "_id", label: "Funder ID" },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
    ],
  },
  {
    key: "iso", 
    label: "ISO",
    columns: [
      { key: "_id", label: "ISO ID" },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
    ],
  },
  {
    key: "syndicator", 
    label: "Syndicator",
    columns: [
      { key: "_id", label: "Syndicator ID" },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
    ],
  },
  {
    key: "portal", 
    label: "Portal",
    columns: [
      { key: "_id", label: "Portal ID" },
      { key: "name", label: "Name" },
    ],
  },
  {
    key: "upload_contact", 
    label: "Upload Contact",
    columns: [
      { key: "_id", label: "Contact ID" },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
    ],
  },
  {
    key: "upload_user", 
    label: "Upload User",
    columns: [
      { key: "_id", label: "User ID" },
      { key: "first_name", label: "First Name" },
      { key: "last_name", label: "Last Name" },
      { key: "email", label: "Email" },
    ],
  },
  { key: "upload_count", label: "Upload Count" },
  { key: "archived", label: "Archived", render: renderStatusBadge },
  { key: "created_date", label: "Created Date", render: formatTime },
  { key: "updated_date", label: "Updated Date", render: formatTime },
]; 