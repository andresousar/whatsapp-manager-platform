#!/usr/bin/env node

/**
 * WhatsApp Manager Platform - Database Seeder
 * 
 * This script seeds the database with initial data
 * including roles, permissions, and sample users
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Sample data
const roles = [
  {
    name: 'SUPER_ADMIN',
    description: 'Super Administrator - Full system access',
    level: 1,
    isSystemRole: true
  },
  {
    name: 'ADMIN',
    description: 'Administrator - Account management',
    level: 2,
    isSystemRole: true
  },
  {
    name: 'SUPERVISOR',
    description: 'Supervisor - Team management',
    level: 3,
    isSystemRole: true
  },
  {
    name: 'AGENT',
    description: 'Agent - Customer service',
    level: 4,
    isSystemRole: true
  },
  {
    name: 'ANALYST',
    description: 'Analyst - Reports and analytics',
    level: 4,
    isSystemRole: true
  }
];

const permissions = [
  // System permissions
  { name: 'system:manage', resource: 'system', action: 'manage', description: 'Manage system settings' },
  { name: 'system:settings', resource: 'system', action: 'settings', description: 'Access system settings' },
  { name: 'system:backup', resource: 'system', action: 'backup', description: 'Create system backups' },
  { name: 'system:logs', resource: 'system', action: 'logs', description: 'View system logs' },
  
  // User permissions
  { name: 'users:create', resource: 'users', action: 'create', description: 'Create users' },
  { name: 'users:read', resource: 'users', action: 'read', description: 'Read users' },
  { name: 'users:update', resource: 'users', action: 'update', description: 'Update users' },
  { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
  { name: 'users:manage_roles', resource: 'users', action: 'manage_roles', description: 'Manage user roles' },
  { name: 'users:read_all', resource: 'users', action: 'read_all', description: 'Read all users' },
  { name: 'users:read_team', resource: 'users', action: 'read_team', description: 'Read team users' },
  { name: 'users:read_self', resource: 'users', action: 'read_self', description: 'Read own profile' },
  { name: 'users:update_self', resource: 'users', action: 'update_self', description: 'Update own profile' },
  { name: 'users:assign_team', resource: 'users', action: 'assign_team', description: 'Assign users to teams' },
  
  // Team permissions
  { name: 'teams:create', resource: 'teams', action: 'create', description: 'Create teams' },
  { name: 'teams:read', resource: 'teams', action: 'read', description: 'Read teams' },
  { name: 'teams:update', resource: 'teams', action: 'update', description: 'Update teams' },
  { name: 'teams:delete', resource: 'teams', action: 'delete', description: 'Delete teams' },
  { name: 'teams:manage_members', resource: 'teams', action: 'manage_members', description: 'Manage team members' },
  { name: 'teams:read_all', resource: 'teams', action: 'read_all', description: 'Read all teams' },
  { name: 'teams:read_own', resource: 'teams', action: 'read_own', description: 'Read own team' },
  { name: 'teams:update_own', resource: 'teams', action: 'update_own', description: 'Update own team' },
  { name: 'teams:manage_members_own', resource: 'teams', action: 'manage_members_own', description: 'Manage own team members' },
  
  // Number permissions
  { name: 'numbers:create', resource: 'numbers', action: 'create', description: 'Create WhatsApp numbers' },
  { name: 'numbers:read', resource: 'numbers', action: 'read', description: 'Read WhatsApp numbers' },
  { name: 'numbers:update', resource: 'numbers', action: 'update', description: 'Update WhatsApp numbers' },
  { name: 'numbers:delete', resource: 'numbers', action: 'delete', description: 'Delete WhatsApp numbers' },
  { name: 'numbers:configure', resource: 'numbers', action: 'configure', description: 'Configure WhatsApp numbers' },
  { name: 'numbers:read_all', resource: 'numbers', action: 'read_all', description: 'Read all numbers' },
  { name: 'numbers:read_team', resource: 'numbers', action: 'read_team', description: 'Read team numbers' },
  
  // Conversation permissions
  { name: 'conversations:read', resource: 'conversations', action: 'read', description: 'Read conversations' },
  { name: 'conversations:update', resource: 'conversations', action: 'update', description: 'Update conversations' },
  { name: 'conversations:assign', resource: 'conversations', action: 'assign', description: 'Assign conversations' },
  { name: 'conversations:transfer', resource: 'conversations', action: 'transfer', description: 'Transfer conversations' },
  { name: 'conversations:reply', resource: 'conversations', action: 'reply', description: 'Reply to conversations' },
  { name: 'conversations:read_all', resource: 'conversations', action: 'read_all', description: 'Read all conversations' },
  { name: 'conversations:read_team', resource: 'conversations', action: 'read_team', description: 'Read team conversations' },
  { name: 'conversations:read_assigned', resource: 'conversations', action: 'read_assigned', description: 'Read assigned conversations' },
  { name: 'conversations:assign_any', resource: 'conversations', action: 'assign_any', description: 'Assign any conversation' },
  { name: 'conversations:assign_team', resource: 'conversations', action: 'assign_team', description: 'Assign team conversations' },
  
  // Report permissions
  { name: 'reports:view', resource: 'reports', action: 'view', description: 'View reports' },
  { name: 'reports:export', resource: 'reports', action: 'export', description: 'Export reports' },
  { name: 'reports:create_dashboard', resource: 'reports', action: 'create_dashboard', description: 'Create dashboards' },
  { name: 'reports:view_all', resource: 'reports', action: 'view_all', description: 'View all reports' },
  { name: 'reports:view_team', resource: 'reports', action: 'view_team', description: 'View team reports' },
  { name: 'reports:view_self', resource: 'reports', action: 'view_self', description: 'View own reports' },
  { name: 'reports:view_advanced', resource: 'reports', action: 'view_advanced', description: 'View advanced analytics' },
  { name: 'reports:export_raw', resource: 'reports', action: 'export_raw', description: 'Export raw data' },
  
  // Billing permissions
  { name: 'billing:view', resource: 'billing', action: 'view', description: 'View billing information' },
  { name: 'billing:manage', resource: 'billing', action: 'manage', description: 'Manage billing' }
];

// Role-Permission mappings
const rolePermissions = {
  'SUPER_ADMIN': [
    'system:manage', 'system:settings', 'system:backup', 'system:logs',
    'users:create', 'users:read', 'users:update', 'users:delete', 'users:manage_roles', 'users:read_all', 'users:read_team', 'users:read_self', 'users:update_self', 'users:assign_team',
    'teams:create', 'teams:read', 'teams:update', 'teams:delete', 'teams:manage_members', 'teams:read_all', 'teams:read_own', 'teams:update_own', 'teams:manage_members_own',
    'numbers:create', 'numbers:read', 'numbers:update', 'numbers:delete', 'numbers:configure', 'numbers:read_all', 'numbers:read_team',
    'conversations:read', 'conversations:update', 'conversations:assign', 'conversations:transfer', 'conversations:reply', 'conversations:read_all', 'conversations:read_team', 'conversations:read_assigned', 'conversations:assign_any', 'conversations:assign_team',
    'reports:view', 'reports:export', 'reports:create_dashboard', 'reports:view_all', 'reports:view_team', 'reports:view_self', 'reports:view_advanced', 'reports:export_raw',
    'billing:view', 'billing:manage'
  ],
  'ADMIN': [
    'users:create', 'users:read', 'users:update', 'users:delete', 'users:manage_roles', 'users:read_all', 'users:read_team', 'users:read_self', 'users:update_self', 'users:assign_team',
    'teams:create', 'teams:read', 'teams:update', 'teams:delete', 'teams:manage_members', 'teams:read_all', 'teams:read_own', 'teams:update_own', 'teams:manage_members_own',
    'numbers:read', 'numbers:update', 'numbers:configure', 'numbers:read_all', 'numbers:read_team',
    'conversations:read', 'conversations:update', 'conversations:assign', 'conversations:transfer', 'conversations:reply', 'conversations:read_all', 'conversations:read_team', 'conversations:read_assigned', 'conversations:assign_any', 'conversations:assign_team',
    'reports:view', 'reports:export', 'reports:create_dashboard', 'reports:view_all', 'reports:view_team', 'reports:view_self', 'reports:view_advanced', 'reports:export_raw',
    'billing:view'
  ],
  'SUPERVISOR': [
    'users:read_team', 'users:update_team', 'users:read_self', 'users:update_self',
    'teams:read_own', 'teams:update_own', 'teams:manage_members_own',
    'numbers:read_team',
    'conversations:read_team', 'conversations:assign_team', 'conversations:transfer_team', 'conversations:reply',
    'reports:view_team', 'reports:export_team', 'reports:view_self'
  ],
  'AGENT': [
    'users:read_self', 'users:update_self',
    'teams:read_own',
    'conversations:read_assigned', 'conversations:reply', 'conversations:update_assigned',
    'reports:view_self'
  ],
  'ANALYST': [
    'users:read_self', 'users:update_self',
    'conversations:read_team',
    'reports:view_team', 'reports:view_advanced', 'reports:export_team', 'reports:create_dashboards'
  ]
};

const sampleUsers = [
  {
    email: 'admin@whatsapp-manager.com',
    password: 'Admin123!',
    firstName: 'System',
    lastName: 'Administrator',
    roleName: 'SUPER_ADMIN'
  },
  {
    email: 'supervisor@whatsapp-manager.com',
    password: 'Supervisor123!',
    firstName: 'Team',
    lastName: 'Supervisor',
    roleName: 'SUPERVISOR'
  },
  {
    email: 'agent@whatsapp-manager.com',
    password: 'Agent123!',
    firstName: 'Customer',
    lastName: 'Agent',
    roleName: 'AGENT'
  }
];

const sampleTeams = [
  {
    name: 'Customer Support',
    description: 'Main customer support team',
    isActive: true
  },
  {
    name: 'Sales Team',
    description: 'Sales and lead generation team',
    isActive: true
  },
  {
    name: 'Technical Support',
    description: 'Technical support and troubleshooting',
    isActive: true
  }
];

/**
 * Seed roles
 */
async function seedRoles() {
  console.log('🌱 Seeding roles...');
  
  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: roleData,
      create: roleData
    });
  }
  
  console.log(`✅ Seeded ${roles.length} roles`);
}

/**
 * Seed permissions
 */
async function seedPermissions() {
  console.log('🌱 Seeding permissions...');
  
  for (const permissionData of permissions) {
    await prisma.permission.upsert({
      where: { name: permissionData.name },
      update: permissionData,
      create: permissionData
    });
  }
  
  console.log(`✅ Seeded ${permissions.length} permissions`);
}

/**
 * Seed role-permission mappings
 */
async function seedRolePermissions() {
  console.log('🌱 Seeding role-permission mappings...');
  
  for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    
    for (const permissionName of permissionNames) {
      const permission = await prisma.permission.findUnique({ where: { name: permissionName } });
      
      if (role && permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id
          }
        });
      }
    }
  }
  
  console.log('✅ Seeded role-permission mappings');
}

/**
 * Seed teams
 */
async function seedTeams() {
  console.log('🌱 Seeding teams...');
  
  for (const teamData of sampleTeams) {
    await prisma.team.upsert({
      where: { name: teamData.name },
      update: teamData,
      create: teamData
    });
  }
  
  console.log(`✅ Seeded ${sampleTeams.length} teams`);
}

/**
 * Seed users
 */
async function seedUsers() {
  console.log('🌱 Seeding users...');
  
  for (const userData of sampleUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const role = await prisma.role.findUnique({ where: { name: userData.roleName } });
    
    if (role) {
      await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          ...userData,
          passwordHash: hashedPassword,
          roleId: role.id
        },
        create: {
          email: userData.email,
          passwordHash: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          roleId: role.id,
          isActive: true
        }
      });
    }
  }
  
  console.log(`✅ Seeded ${sampleUsers.length} users`);
}

/**
 * Main seed function
 */
async function main() {
  console.log('🚀 Starting database seeding...');
  
  try {
    await seedRoles();
    await seedPermissions();
    await seedRolePermissions();
    await seedTeams();
    await seedUsers();
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Sample users created:');
    sampleUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.roleName}) - Password: ${user.password}`);
    });
    console.log('');
    console.log('You can now login with any of these accounts.');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  seedRoles,
  seedPermissions,
  seedRolePermissions,
  seedTeams,
  seedUsers
};
