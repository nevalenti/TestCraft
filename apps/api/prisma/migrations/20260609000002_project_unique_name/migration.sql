ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_name_key" UNIQUE ("user_id", "name");
