-- Database Schema for Campus Concern System

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_type') THEN
        CREATE TYPE role_type AS ENUM ('student', 'staff', 'hod', 'principal', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'department_type') THEN
        CREATE TYPE department_type AS ENUM ('CSE', 'CCE', 'AIML', 'Mech', 'Civil', 'None');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_type') THEN
        CREATE TYPE status_type AS ENUM ('Not Viewed', 'Opened', 'Processing', 'Solved');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    roll_number VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    department department_type DEFAULT 'None',
    role role_type NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id),
    assigned_to_role role_type,
    assigned_to_dept department_type,
    assigned_to_user_id INTEGER REFERENCES users(id),
    status status_type DEFAULT 'Not Viewed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
