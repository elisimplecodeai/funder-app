import { Document } from "@/types/document";
import { formatTime, getNestedValue } from "@/components/GenericList/utils";
import { deleteDocument, downloadDocument, formatFileSize } from "@/lib/api/documents";
import { useRouter, usePathname } from 'next/navigation';
import { useState } from "react";

type DetailModalProps = {
    title: string;
    onClose: () => void;
    data: Document;
    onSuccess?: () => void;
};

export function DetailModal({ title, data, onClose, onSuccess }: DetailModalProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    // Safe render function using GenericList utilities
    const safeRender = (value: any): React.ReactNode => {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        if (typeof value === 'object' && value.name) return String(value.name);
        return getNestedValue(data, value) || 'N/A';
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            await deleteDocument(data._id);
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(
                typeof err === 'object' && err !== null && 'message' in err
                    ? String((err as Error).message)
                    : 'Failed to delete Document'
            );
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        setError(null);

        try {
            const blob = await downloadDocument(data._id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.file_name || 'document';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(
                typeof err === 'object' && err !== null && 'message' in err
                    ? String((err as Error).message)
                    : 'Failed to download Document'
            );
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <>
            {/* Delete Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this Document? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowConfirm(false);
                                    handleDelete();
                                }}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Modal */}
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
                <div className="bg-gray-100 p-6 rounded-2xl shadow-xl max-w-xl w-full relative max-h-[90vh] overflow-y-auto">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">{title}</h2>

                    {error && (
                        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    {/* Scrollable content only */}
                    <div className="max-h-[60vh] overflow-y-auto border rounded-lg p-4 border-gray-200 bg-gray-50 mb-6">

                        <div className="gap-y-3 gap-x-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">

                            {/* Document Basic Information */}
                            <div className="flex flex-col gap-1 break-words whitespace-normal">
                                <p className="text-xs font-medium text-gray-500">Document ID</p>
                                <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, '_id')}</h3>
                            </div>

                            <div className="flex flex-col gap-1 break-words whitespace-normal">
                                <p className="text-xs font-medium text-gray-500">File Name</p>
                                <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'file_name')}</h3>
                            </div>

                            <div className="flex flex-col gap-1 break-words whitespace-normal">
                                <p className="text-xs font-medium text-gray-500">File Type</p>
                                <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'file_type')}</h3>
                            </div>

                            <div className="flex flex-col gap-1 break-words whitespace-normal">
                                <p className="text-xs font-medium text-gray-500">File Size</p>
                                <h3 className="text-md font-semibold text-gray-800">{data?.file_size ? formatFileSize(data.file_size) : 'N/A'}</h3>
                            </div>

                            <div className="flex flex-col gap-1 break-words whitespace-normal">
                                <p className="text-xs font-medium text-gray-500">Upload Count</p>
                                <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'upload_count') || 0}</h3>
                            </div>

                            <div className="flex flex-col gap-1 break-words whitespace-normal">
                                <p className="text-xs font-medium text-gray-500">Archived</p>
                                <h3 className="text-md font-semibold">
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                        data?.archived 
                                            ? 'bg-red-100 text-red-700' 
                                            : 'bg-green-100 text-green-700'
                                    }`}>
                                        {data?.archived ? "Yes" : "No"}
                                    </span>
                                </h3>
                            </div>

                            {/* Divider */}
                            <div className="col-span-2 border-b border-gray-300" />

                            {/* Merchant Information */}
                            {data.merchant && (
                                <>
                                    <div className="col-span-2">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Merchant Information</h4>
                                    </div>
                                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                                        <p className="text-xs font-medium text-gray-500">Merchant Name</p>
                                        <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'merchant.name')}</h3>
                                    </div>

                                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                                        <p className="text-xs font-medium text-gray-500">Merchant DBA</p>
                                        <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'merchant.dba_name')}</h3>
                                    </div>
                                </>
                            )}

                            {/* Divider */}
                            <div className="col-span-2 border-b border-gray-200" />

                            {/* Funder Information */}
                            {data.funder && (
                                <>
                                    <div className="col-span-2">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Funder Information</h4>
                                    </div>
                                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                                        <p className="text-xs font-medium text-gray-500">Funder Name</p>
                                        <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'funder.name')}</h3>
                                    </div>

                                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                                        <p className="text-xs font-medium text-gray-500">Funder Email</p>
                                        <h3 className="text-md font-semibold text-gray-800">
                                            {data?.funder?.email ? (
                                                <a 
                                                    href={`mailto:${data.funder.email}`}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    {data.funder.email}
                                                </a>
                                            ) : getNestedValue(data, 'funder.email')}
                                        </h3>
                                    </div>
                                </>
                            )}

                            {/* Portal Information */}
                            {data.portal && (
                                <>
                                    <div className="col-span-2 border-b border-gray-200" />
                                    <div className="col-span-2">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Portal Information</h4>
                                    </div>
                                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                                        <p className="text-xs font-medium text-gray-500">Portal Name</p>
                                        <h3 className="text-md font-semibold text-gray-800">{getNestedValue(data, 'portal.name')}</h3>
                                    </div>
                                </>
                            )}

                            {/* Upload User */}
                            {data.upload_user && (
                                <>
                                    <div className="col-span-2 border-b border-gray-200" />
                                    <div className="col-span-2">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Upload User</h4>
                                    </div>
                                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                                        <p className="text-xs font-medium text-gray-500">User Name</p>
                                        <h3 className="text-md font-semibold text-gray-800">
                                            {data?.upload_user ? 
                                                `${getNestedValue(data, 'upload_user.first_name')} ${getNestedValue(data, 'upload_user.last_name')}` 
                                                : 'N/A'
                                            }
                                        </h3>
                                    </div>

                                    <div className="flex flex-col gap-1 break-words whitespace-normal">
                                        <p className="text-xs font-medium text-gray-500">User Email</p>
                                        <h3 className="text-md font-semibold text-gray-800">
                                            {data?.upload_user?.email ? (
                                                <a 
                                                    href={`mailto:${data.upload_user.email}`}
                                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    {data.upload_user.email}
                                                </a>
                                            ) : getNestedValue(data, 'upload_user.email')}
                                        </h3>
                                    </div>
                                </>
                            )}

                            {/* Divider */}
                            <div className="col-span-2 border-b border-gray-200" />

                            {/* Dates */}
                            <div className="flex flex-col gap-1 break-words whitespace-normal">
                                <p className="text-xs font-medium text-gray-500">Created Date</p>
                                <h3 className="text-md font-semibold text-gray-800">{data?.created_date ? formatTime(data.created_date) : 'N/A'}</h3>
                            </div>

                            <div className="flex flex-col gap-1 break-words whitespace-normal">
                                <p className="text-xs font-medium text-gray-500">Updated Date</p>
                                <h3 className="text-md font-semibold text-gray-800">{data?.updated_date ? formatTime(data.updated_date) : 'N/A'}</h3>
                            </div>

                        </div>
                    </div>

                    {/* Button Row */}
                    <div className="flex justify-evenly gap-4">
                        <button
                            className="w-1/4 px-6 py-2 rounded-lg bg-green-600 text-white text-base font-medium hover:bg-green-700 transition disabled:opacity-50"
                            onClick={handleDownload}
                            disabled={isDownloading || !data.file}
                        >
                            {isDownloading ? 'Downloading...' : 'Download'}
                        </button>
                        <button
                            className="w-1/4 px-6 py-2 rounded-lg bg-blue-600 text-white text-base font-medium hover:bg-blue-700 transition"
                            onClick={() => {
                                router.push(`${pathname}/${data._id}`);
                            }}
                        >
                            View
                        </button>
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="w-1/4 px-6 py-2 rounded-lg bg-red-600 text-white text-base font-medium hover:bg-red-700 transition"
                        >
                            Delete
                        </button>
                        <button
                            onClick={onClose}
                            className="w-1/4 px-6 py-2 rounded-lg border border-gray-300 text-gray-700 text-base font-medium hover:bg-gray-300 hover:text-gray-800 transition"
                        >
                            Close
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
} 