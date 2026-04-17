#!/usr/bin/env node
// Direct PostgreSQL database initialization script
// Run this script on the server to initialize the database tables

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'portfolio',
  user: process.env.DB_USER || 'portfolio',
  password: process.env.DB_PASSWORD || 'portfolio123',
});

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to PostgreSQL, initializing database...');
    
    // Create tables
    await client.query(`
      -- Profiles table
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        title VARCHAR(200),
        bio TEXT,
        avatar_key VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        location VARCHAR(200),
        website VARCHAR(255),
        social_links JSONB,
        show_email BOOLEAN DEFAULT true,
        show_phone BOOLEAN DEFAULT true,
        show_location BOOLEAN DEFAULT true,
        show_github BOOLEAN DEFAULT false,
        show_linkedin BOOLEAN DEFAULT false,
        show_twitter BOOLEAN DEFAULT false,
        show_instagram BOOLEAN DEFAULT false,
        custom_title VARCHAR(50),
        custom_content VARCHAR(200),
        show_custom BOOLEAN DEFAULT false,
        timeline_title VARCHAR(50) DEFAULT '成长规划',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Self introduction table
      CREATE TABLE IF NOT EXISTS self_introduction (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        is_visible BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Self intro cards table
      CREATE TABLE IF NOT EXISTS self_intro_cards (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        title VARCHAR(100),
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Work experiences table
      CREATE TABLE IF NOT EXISTS work_experiences (
        id SERIAL PRIMARY KEY,
        company VARCHAR(200) NOT NULL,
        position VARCHAR(200) NOT NULL,
        description TEXT,
        description_align VARCHAR(20) DEFAULT 'left',
        start_date VARCHAR(20) NOT NULL,
        end_date VARCHAR(20),
        location VARCHAR(200),
        image_display_mode VARCHAR(20) DEFAULT 'none',
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Work experience images table
      CREATE TABLE IF NOT EXISTS work_experience_images (
        id SERIAL PRIMARY KEY,
        work_experience_id INTEGER REFERENCES work_experiences(id) ON DELETE CASCADE,
        file_key VARCHAR(255) NOT NULL,
        title VARCHAR(200),
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Educations table
      CREATE TABLE IF NOT EXISTS educations (
        id SERIAL PRIMARY KEY,
        school VARCHAR(200) NOT NULL,
        degree VARCHAR(200) NOT NULL,
        field VARCHAR(200),
        start_date VARCHAR(20) NOT NULL,
        end_date VARCHAR(20),
        description TEXT,
        description_align VARCHAR(20) DEFAULT 'left',
        awards TEXT,
        gpa VARCHAR(50),
        ranking VARCHAR(50),
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Skills table
      CREATE TABLE IF NOT EXISTS skills (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        level INTEGER DEFAULT 80,
        category VARCHAR(100),
        description TEXT,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Skill categories table
      CREATE TABLE IF NOT EXISTS skill_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        order_index INTEGER DEFAULT 0,
        is_visible BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Works table
      CREATE TABLE IF NOT EXISTS works (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        description_align VARCHAR(20) DEFAULT 'left',
        category VARCHAR(100),
        tags JSONB,
        display_mode VARCHAR(20) DEFAULT 'single',
        cover_image_key VARCHAR(255),
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Work items table
      CREATE TABLE IF NOT EXISTS work_items (
        id SERIAL PRIMARY KEY,
        work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL,
        title VARCHAR(200),
        file_key VARCHAR(255) NOT NULL,
        description TEXT,
        is_carousel_item INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Admin users table
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Module orders table
      CREATE TABLE IF NOT EXISTS module_orders (
        id SERIAL PRIMARY KEY,
        module_name VARCHAR(100) NOT NULL UNIQUE,
        order_index INTEGER DEFAULT 0,
        is_visible BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Visit stats table
      CREATE TABLE IF NOT EXISTS visit_stats (
        id SERIAL PRIMARY KEY,
        total_visits INTEGER DEFAULT 0,
        today_visits INTEGER DEFAULT 0,
        last_visit_at TIMESTAMP WITH TIME ZONE,
        today_date DATE
      );

      -- Contact info table
      CREATE TABLE IF NOT EXISTS contact_info (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255),
        phone VARCHAR(50),
        wechat_qr_key VARCHAR(255),
        wechat_id VARCHAR(100),
        is_visible BOOLEAN DEFAULT true,
        show_email BOOLEAN DEFAULT true,
        show_phone BOOLEAN DEFAULT true,
        show_wechat BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Dev logs table
      CREATE TABLE IF NOT EXISTS dev_logs (
        id SERIAL PRIMARY KEY,
        version VARCHAR(50),
        title VARCHAR(200) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        requirements TEXT,
        completed_features TEXT,
        bug_fixes TEXT,
        notes TEXT,
        order_index INTEGER DEFAULT 0
      );

      -- Timeline items table
      CREATE TABLE IF NOT EXISTS timeline_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        start_year INTEGER NOT NULL,
        start_month INTEGER,
        end_year INTEGER,
        end_month INTEGER,
        color VARCHAR(50),
        breaks JSONB,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Health check table
      CREATE TABLE IF NOT EXISTS health_check (
        id SERIAL PRIMARY KEY,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Insert default admin user (username: Lxgood, password: LIUXINgood)
      INSERT INTO admin_users (username, password_hash)
      VALUES ('Lxgood', '$2b$10$K8M1qQZQZQZQZQZQZQZQZOZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ')
      ON CONFLICT (username) DO NOTHING;

      -- Insert default module orders
      INSERT INTO module_orders (module_name, order_index, is_visible) VALUES
        ('profile', 1, true),
        ('self-introduction', 2, true),
        ('work-experiences', 3, true),
        ('educations', 4, true),
        ('skills', 5, true),
        ('works', 6, true),
        ('timeline', 7, true),
        ('contact', 8, true)
      ON CONFLICT (module_name) DO NOTHING;

      -- Insert default profile
      INSERT INTO profiles (name, title, bio, show_email, show_phone, show_location)
      VALUES ('刘新', '全栈工程师', '热爱技术，擅长前端开发', true, true, true)
      ON CONFLICT DO NOTHING;

      -- Insert default health check
      INSERT INTO health_check (id) VALUES (1)
      ON CONFLICT (id) DO NOTHING;

    `);
    
    console.log('Database tables created successfully!');
    console.log('Admin user created: Lxgood / LIUXINgood');
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase()
  .then(() => {
    console.log('Database initialization complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });
