'use client';

import { FiX, FiUser, FiMail, FiPhone, FiMapPin, FiCalendar } from 'react-icons/fi';

export default function UserContactModal({ user, contact, onClose }) {
  if (!contact) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-primary-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FiUser className="w-5 h-5 text-primary-700" />
            </div>
            <h2 className="text-xl font-bold text-primary-900">Contact Information</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5 text-primary-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary-900 border-b pb-2">
              Personal Details
            </h3>

            {/* Full Name */}
            <div className="flex items-start gap-3">
              <FiUser className="w-5 h-5 text-primary-500 mt-1" />
              <div>
                <p className="text-sm text-primary-500 font-medium">Full Name</p>
                <p className="text-base text-primary-900">{contact.name || 'N/A'}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3">
              <FiMail className="w-5 h-5 text-primary-500 mt-1" />
              <div>
                <p className="text-sm text-primary-500 font-medium">Email Address</p>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-base text-primary-900 hover:text-primary-700 hover:underline"
                >
                  {contact.email}
                </a>
              </div>
            </div>

            {/* Phone */}
            {contact.phone && (
              <div className="flex items-start gap-3">
                <FiPhone className="w-5 h-5 text-primary-500 mt-1" />
                <div>
                  <p className="text-sm text-primary-500 font-medium">Phone Number</p>
                  <a
                    href={`tel:+91${contact.phone}`}
                    className="text-base text-primary-900 hover:text-primary-700 hover:underline"
                  >
                    +91 {contact.phone}
                  </a>
                </div>
              </div>
            )}

            {/* Account Created */}
            <div className="flex items-start gap-3">
              <FiCalendar className="w-5 h-5 text-primary-500 mt-1" />
              <div>
                <p className="text-sm text-primary-500 font-medium">Account Created</p>
                <p className="text-base text-primary-900">
                  {new Date(contact.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {contact.address && (
            <div className="space-y-4 bg-primary-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-primary-900 border-b border-primary-200 pb-2">
                Shipping Address
              </h3>

              <div className="flex items-start gap-3">
                <FiMapPin className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" />
                <div className="space-y-1">
                  {contact.address.fullName && (
                    <p className="text-base font-medium text-primary-900">
                      {contact.address.fullName}
                    </p>
                  )}
                  {contact.address.phone && (
                    <p className="text-sm text-primary-700">
                      Phone: +91 {contact.address.phone}
                    </p>
                  )}
                  <p className="text-base text-primary-800">
                    {contact.address.addressLine1}
                  </p>
                  {contact.address.addressLine2 && (
                    <p className="text-base text-primary-800">
                      {contact.address.addressLine2}
                    </p>
                  )}
                  {(contact.address.city || contact.address.state) && (
                    <p className="text-base text-primary-800">
                      {[contact.address.city, contact.address.state]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {contact.address.postalCode && (
                    <p className="text-base text-primary-800">
                      PIN: {contact.address.postalCode}
                    </p>
                  )}
                  <p className="text-base text-primary-800">
                    {contact.address.country || 'India'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!contact.address && (
            <div className="bg-primary-50 p-4 rounded-lg text-center">
              <FiMapPin className="w-8 h-8 text-primary-400 mx-auto mb-2" />
              <p className="text-primary-600">No shipping address available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-primary-50 border-t border-primary-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full bg-primary-900 text-white px-6 py-2 rounded-lg hover:bg-primary-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
