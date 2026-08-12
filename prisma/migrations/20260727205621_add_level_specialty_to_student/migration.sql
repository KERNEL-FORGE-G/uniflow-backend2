/*
  Warnings:
  - Added the required column `levelId` to the `students` table without a default value. This is not possible if the table is not empty.
  -> Résolu en ajoutant la colonne comme optionnelle d'abord, en assignant une
     valeur par défaut aux lignes de test existantes, puis en la rendant obligatoire.
*/

-- AlterTable (levelId ajouté comme optionnel dans un premier temps)
ALTER TABLE "students" ADD COLUMN     "levelId" TEXT,
ADD COLUMN     "specialtyId" TEXT;

-- Assigner le niveau de test (Licence 1, créé par prisma/seed.ts) aux étudiants déjà existants
UPDATE "students" SET "levelId" = '9ff43c33-1532-48fb-9491-f61c2d2ba5da' WHERE "levelId" IS NULL;

-- Rendre la colonne obligatoire maintenant que toutes les lignes ont une valeur
ALTER TABLE "students" ALTER COLUMN "levelId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "specialties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
