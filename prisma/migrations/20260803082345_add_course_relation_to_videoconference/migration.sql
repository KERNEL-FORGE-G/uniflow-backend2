-- AddForeignKey
ALTER TABLE "video_conferences" ADD CONSTRAINT "video_conferences_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
