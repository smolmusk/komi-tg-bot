#!/usr/bin/env node

/**
 * Railway Database Migration Script
 * This script will be run after deployment to set up the database
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Railway database migration...');

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Push schema to database (creates tables)
  console.log('🗄️ Pushing schema to database...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('✅ Database migration completed successfully!');
} catch (error) {
  console.error('❌ Database migration failed:', error.message);
  process.exit(1);
}
