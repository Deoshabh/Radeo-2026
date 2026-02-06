import { FiX, FiUser, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export default function UserContactModal({ user, onClose }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-200">
          <h3 className="text-xl font-semibold text-primary-900 flex items-center gap-2">
            <FiUser className="w-5 h-5" />
            Contact Information
          </h3>
          <button
            onClick={onClose}
            className="text-primary-500 hover:text-primary-700 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary-900 text-white flex items-center justify-center font-semibold text-2xl">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-primary-900">{user.name}</h4>
                <p className="text-sm text-primary-600">
                  Member since {new Date(user.createdAt).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-lg">
              <FiMail className="w-5 h-5 text-primary-700 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-900 mb-1">Email Address</p>
                <a 
                  href={`mailto:${user.email}`}
                  className="text-primary-700 hover:text-primary-900 hover:underline"
                >
                  {user.email}
                </a>
              </div>
            </div>

            {/* Phone */}
            {user.phone && (
              <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-lg">
                <FiPhone className="w-5 h-5 text-primary-700 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary-900 mb-1">Phone Number</p>
                  <a 
                    href={`tel:+91${user.phone}`}
                    className="text-primary-700 hover:text-primary-900 hover:underline"
                  >
                    +91 {user.phone}
                  </a>
                </div>
              </div>
            )}

            {/* Addresses */}
            {user.addresses && user.addresses.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-primary-900 flex items-center gap-2">
                  <FiMapPin className="w-5 h-5" />
                  Saved Addresses ({user.addresses.length})
                </p>
                {user.addresses.map((address, index) => (
                  <div key={index} className="p-4 bg-primary-50 rounded-lg space-y-2">
                    {address.isDefault && (
                      <span className="inline-block px-2 py-1 bg-primary-900 text-white text-xs rounded font-medium">
                        Default
                      </span>
                    )}
                    <p className="font-medium text-primary-900">{address.fullName}</p>
                    {address.phone && (
                      <p className="text-sm text-primary-700">
                        <a href={`tel:+91${address.phone}`} className="hover:underline">
                          +91 {address.phone}
                        </a>
                      </p>
                    )}
                    <p className="text-sm text-primary-700">
                      {address.addressLine1}
                      {address.addressLine2 && `, ${address.addressLine2}`}
                    </p>
                    {(address.city || address.state) && (
                      <p className="text-sm text-primary-700">
                        {[address.city, address.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {address.postalCode && (
                      <p className="text-sm text-primary-700">PIN: {address.postalCode}</p>
                    )}
                    <p className="text-sm text-primary-700">{address.country || 'India'}</p>
                  </div>
                ))}
              </div>
            )}

            {!user.phone && (!user.addresses || user.addresses.length === 0) && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  No additional contact information available for this user.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-primary-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
