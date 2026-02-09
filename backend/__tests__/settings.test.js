const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../server');
const User = require('../models/User');
const SiteSetting = require('../models/SiteSetting');

describe('Settings API', () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    const adminUser = await User.create({
      name: 'Settings Admin',
      email: 'settings-admin@test.com',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      role: 'admin',
      isBlocked: false,
    });

    const regularUser = await User.create({
      name: 'Settings User',
      email: 'settings-user@test.com',
      passwordHash: await bcrypt.hash('User123!', 10),
      role: 'customer',
      isBlocked: false,
    });

    adminToken = jwt.sign(
      { id: adminUser._id.toString() },
      process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    userToken = jwt.sign(
      { id: regularUser._id.toString() },
      process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    await SiteSetting.deleteMany({ key: { $in: ['heroSection'] } });
  });

  it('returns public settings with defaults', async () => {
    const res = await request(app).get('/api/v1/settings');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('settings.heroSection');
    expect(res.body).toHaveProperty('settings.footerContent');
    expect(res.body).toHaveProperty('settings.faqPage');
    expect(res.body).toHaveProperty('settings.maintenanceMode');
    expect(res.body.settings.maintenanceMode).not.toHaveProperty('allowedIPs');
  });

  it('blocks non-admin users from updating settings', async () => {
    const res = await request(app)
      .put('/api/v1/admin/settings/heroSection')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        value: {
          enabled: true,
          title: 'Blocked Update',
        },
      });

    expect(res.status).toBe(403);
  });

  it('updates a setting as admin and tracks history', async () => {
    const updateRes = await request(app)
      .put('/api/v1/admin/settings/heroSection')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        value: {
          enabled: true,
          title: 'Updated Hero',
          subtitle: 'From test',
          description: 'Test description',
          primaryButtonText: 'Shop',
          primaryButtonLink: '/products',
          secondaryButtonText: 'About',
          secondaryButtonLink: '/about',
          backgroundGradient: 'from-primary-50 via-brand-cream/20 to-primary-100',
        },
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body).toHaveProperty('key', 'heroSection');
    expect(updateRes.body).toHaveProperty('value.title', 'Updated Hero');

    const historyRes = await request(app)
      .get('/api/v1/admin/settings/heroSection/history')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(historyRes.status).toBe(200);
    expect(Array.isArray(historyRes.body.history)).toBe(true);
    expect(historyRes.body.history.length).toBeGreaterThan(0);
  });
});
