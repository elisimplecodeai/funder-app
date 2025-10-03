import { Funder } from "./funder";
import { ISO } from "./iso";
import { Merchant } from "./merchant";
import { Portal } from "./portal";
import { Syndicator } from "./syndicator";
import { Contact } from "./contact";
import { Admin } from "./admin";
import { User } from "./user";
import { Representative } from "./representative";
import { Bookkeeper } from "./bookkeeper";


// Main Document interface
export interface Document {
    merchant: Merchant;
    funder: Funder;
    iso: ISO;
    syndicator: Syndicator;

    created_date: string;
    updated_date: string;
    __v: number;

    file: string;
    file_name: string;
    file_type: string;
    file_size: number;

    portal: Portal;
    upload_contact: Contact;
    upload_representative: Representative;
    upload_syndicator: Syndicator;
    upload_admin: Admin;
    upload_user: User;
    upload_bookkeeper: Bookkeeper;
    archived: boolean;

    upload_count: number;
    upload_history_list?: Document[];

    last_modified: string;

    createdAt: string;
    updatedAt: string;
    
    _id: string;
    id: string;

    //  application history
    document?: string;
}

// CreateDocumentData type - omits auto-generated and optional fields
export type CreateDocumentData = Omit<Document, '_id' | 'id' | 'created_date' | 'updated_date' | '__v' | 'file' | 'file_name' | 'file_type' | 'file_size' | 'upload_count' | 'portal' | 'upload_contact' | 'upload_representative' | 'upload_syndicator' | 'upload_admin' | 'upload_user' | 'upload_bookkeeper' | 'archived'>;

