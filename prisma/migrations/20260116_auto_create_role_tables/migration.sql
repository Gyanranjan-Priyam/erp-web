-- Create or replace function to automatically manage role-based table entries
CREATE OR REPLACE FUNCTION manage_user_role_tables()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT (new user creation)
    IF (TG_OP = 'INSERT') THEN
        IF NEW.role = 'ADMIN' THEN
            INSERT INTO "Admin" ("id", "userId", "name", "createdAt")
            VALUES (gen_random_uuid(), NEW.id, NEW.name, NOW())
            ON CONFLICT ("userId") DO NOTHING;
        ELSIF NEW.role = 'TEACHER' THEN
            -- Get a default department (first one available)
            INSERT INTO "Teacher" ("id", "userId", "name", "departmentId", "createdAt")
            SELECT gen_random_uuid(), NEW.id, NEW.name, d.id, NOW()
            FROM "Department" d
            LIMIT 1
            ON CONFLICT ("userId") DO NOTHING;
        ELSIF NEW.role = 'STUDENT' THEN
            -- Get a default department and generate roll number
            INSERT INTO "Student" ("id", "userId", "rollNumber", "name", "departmentId", "semester", "createdAt")
            SELECT 
                gen_random_uuid(), 
                NEW.id, 
                'STU' || LPAD(NEXTVAL('student_roll_seq')::TEXT, 6, '0'),
                NEW.name,
                d.id,
                1,
                NOW()
            FROM "Department" d
            LIMIT 1
            ON CONFLICT ("userId") DO NOTHING;
        END IF;
        RETURN NEW;
    END IF;

    -- Handle UPDATE (role change)
    IF (TG_OP = 'UPDATE' AND OLD.role != NEW.role) THEN
        -- Remove from old role table
        IF OLD.role = 'ADMIN' THEN
            DELETE FROM "Admin" WHERE "userId" = OLD.id;
        ELSIF OLD.role = 'TEACHER' THEN
            DELETE FROM "Teacher" WHERE "userId" = OLD.id;
        ELSIF OLD.role = 'STUDENT' THEN
            DELETE FROM "Student" WHERE "userId" = OLD.id;
        END IF;

        -- Add to new role table
        IF NEW.role = 'ADMIN' THEN
            INSERT INTO "Admin" ("id", "userId", "name", "createdAt")
            VALUES (gen_random_uuid(), NEW.id, NEW.name, NOW())
            ON CONFLICT ("userId") DO NOTHING;
        ELSIF NEW.role = 'TEACHER' THEN
            INSERT INTO "Teacher" ("id", "userId", "name", "departmentId", "createdAt")
            SELECT gen_random_uuid(), NEW.id, NEW.name, d.id, NOW()
            FROM "Department" d
            LIMIT 1
            ON CONFLICT ("userId") DO NOTHING;
        ELSIF NEW.role = 'STUDENT' THEN
            INSERT INTO "Student" ("id", "userId", "rollNumber", "name", "departmentId", "semester", "createdAt")
            SELECT 
                gen_random_uuid(), 
                NEW.id, 
                'STU' || LPAD(NEXTVAL('student_roll_seq')::TEXT, 6, '0'),
                NEW.name,
                d.id,
                1,
                NOW()
            FROM "Department" d
            LIMIT 1
            ON CONFLICT ("userId") DO NOTHING;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for student roll numbers if not exists
CREATE SEQUENCE IF NOT EXISTS student_roll_seq START 1;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS user_role_management_trigger ON "User";

-- Create trigger on User table
CREATE TRIGGER user_role_management_trigger
    AFTER INSERT OR UPDATE OF role
    ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION manage_user_role_tables();
