import AnimatedEntry from '@/components/ui/AnimatedEntry';
import RevenueChart from '@/components/admin/charts/RevenueChart';
import SalesCategoryPieChart from '@/components/admin/charts/SalesCategoryPieChart';

// ... imports remain the same

export default function AdminDashboard() {
  // ... (hooks remain)

  // ... (realtime setup)

  // ... (auth checks)

  const adminCards = [
    // ... (cards remain the same)
  ];

  const quickLinks = [
    // ... (links remain the same)
  ];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-primary-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <AnimatedEntry className="mb-6 sm:mb-8" delay={0}>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-2">Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-primary-600">Welcome back, {user?.name}!</p>
          </AnimatedEntry>

          {/* Stats Cards */}
          <AnimatedEntry className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8" delay={100}>
            {adminCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Link
                  key={index}
                  href={card.link}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-primary-600 text-sm mb-1">{card.title}</p>
                      <p className="text-2xl font-bold text-primary-900">{card.value}</p>
                    </div>
                    <div className={`${card.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </AnimatedEntry>

          {/* Stats Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
            <AnimatedEntry className="lg:col-span-2" delay={200}>
              <RevenueChart />
            </AnimatedEntry>
            <AnimatedEntry delay={250}>
              <SalesCategoryPieChart />
            </AnimatedEntry>
          </div>

          {/* Quick Links */}
          <AnimatedEntry className="bg-white rounded-lg shadow-md p-6" delay={300}>
            <h2 className="text-xl font-bold text-primary-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={index}
                    href={link.href}
                    className="border border-primary-200 rounded-lg p-4 hover:border-primary-400 hover:bg-primary-50 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-brand-brown group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-primary-900 mb-1">{link.title}</h3>
                        <p className="text-sm text-primary-600">{link.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </AnimatedEntry>

          {/* Notice */}
          <AnimatedEntry className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4" delay={400}>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">Admin Panel</h3>
                <p className="text-sm text-yellow-800">
                  This is the admin dashboard. Individual admin pages (Products, Orders, Users, etc.) will be created as you need them.
                  Click on any of the quick actions above to manage different aspects of your e-commerce store.
                </p>
              </div>
            </div>
          </AnimatedEntry>
        </div>
      </div>
    </AdminLayout>
  );
}
