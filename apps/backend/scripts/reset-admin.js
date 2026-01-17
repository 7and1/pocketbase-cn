#!/usr/bin/env node
/**
 * Reset PocketBase Admin Password
 *
 * Usage: node scripts/reset-admin.js
 *
 * This script creates or updates the admin account using PocketBase API.
 */

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || 'admin@pocketbase.cn';
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('❌ PB_ADMIN_PASSWORD is required');
  process.exit(1);
}

async function resetAdmin() {
  const url = `${POCKETBASE_URL}/api/collections/_superusers/records`;

  // First try to create new admin
  const createResponse = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      passwordConfirm: ADMIN_PASSWORD,
    }),
  });

  if (createResponse.ok) {
    console.log(`✅ Admin created: ${ADMIN_EMAIL}`);
    return;
  }

  const createError = await createResponse.json();

  // If admin exists, try to update via auth
  if (createError.code === 409 || createError.message?.includes('exists')) {
    console.log('📧 Admin exists, attempting to update...');

    // Try to login and update
    const authResponse = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (authResponse.ok) {
      console.log(`✅ Admin login successful with new password`);
      return;
    }

    // Login failed, need old password or direct DB access
    console.error('❌ Cannot reset admin password via API without old password');
    console.error('💡 Use PocketBase CLI: pb_admin reset');
    process.exit(1);
  }

  console.error('❌ Failed:', createError);
  process.exit(1);
}

resetAdmin().catch(console.error);
