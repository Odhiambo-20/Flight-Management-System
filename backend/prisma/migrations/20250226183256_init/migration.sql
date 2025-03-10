/*
  Warnings:

  - The primary key for the `Flight` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Flight` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `FlightReservation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `FlightReservation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `paymentId` column on the `FlightReservation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Hotel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Hotel` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `HotelBooking` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `HotelBooking` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `paymentId` column on the `HotelBooking` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `HotelRoom` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `HotelRoom` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Payment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `userId` on the `FlightReservation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `flightId` on the `FlightReservation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `seatNumber` on the `FlightReservation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `HotelBooking` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `roomId` on the `HotelBooking` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `hotelId` on the `HotelRoom` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `roomNumber` on the `HotelRoom` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `Payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `provider` on the `Payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `transactionId` on table `Payment` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('FLIGHT', 'HOTEL');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYPAL', 'MPESA', 'CREDIT_CARD');

-- DropForeignKey
ALTER TABLE "FlightReservation" DROP CONSTRAINT "FlightReservation_flightId_fkey";

-- DropForeignKey
ALTER TABLE "FlightReservation" DROP CONSTRAINT "FlightReservation_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "FlightReservation" DROP CONSTRAINT "FlightReservation_userId_fkey";

-- DropForeignKey
ALTER TABLE "HotelBooking" DROP CONSTRAINT "HotelBooking_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "HotelBooking" DROP CONSTRAINT "HotelBooking_roomId_fkey";

-- DropForeignKey
ALTER TABLE "HotelBooking" DROP CONSTRAINT "HotelBooking_userId_fkey";

-- DropForeignKey
ALTER TABLE "HotelRoom" DROP CONSTRAINT "HotelRoom_hotelId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";

-- DropIndex
DROP INDEX "Payment_referenceId_key";

-- AlterTable
ALTER TABLE "Flight" DROP CONSTRAINT "Flight_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Flight_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "FlightReservation" DROP CONSTRAINT "FlightReservation_pkey",
ADD COLUMN     "paymentStatus" TEXT DEFAULT 'PENDING',
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
DROP COLUMN "flightId",
ADD COLUMN     "flightId" INTEGER NOT NULL,
DROP COLUMN "seatNumber",
ADD COLUMN     "seatNumber" INTEGER NOT NULL,
DROP COLUMN "paymentId",
ADD COLUMN     "paymentId" INTEGER,
ADD CONSTRAINT "FlightReservation_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Hotel" DROP CONSTRAINT "Hotel_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "HotelBooking" DROP CONSTRAINT "HotelBooking_pkey",
ADD COLUMN     "paymentStatus" TEXT DEFAULT 'PENDING',
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
DROP COLUMN "roomId",
ADD COLUMN     "roomId" INTEGER NOT NULL,
DROP COLUMN "paymentId",
ADD COLUMN     "paymentId" INTEGER,
ADD CONSTRAINT "HotelBooking_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "HotelRoom" DROP CONSTRAINT "HotelRoom_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "hotelId",
ADD COLUMN     "hotelId" INTEGER NOT NULL,
DROP COLUMN "roomNumber",
ADD COLUMN     "roomNumber" INTEGER NOT NULL,
ADD CONSTRAINT "HotelRoom_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_pkey",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "refundId" TEXT,
ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
DROP COLUMN "type",
ADD COLUMN     "type" "PaymentType" NOT NULL,
DROP COLUMN "provider",
ADD COLUMN     "provider" "PaymentProvider" NOT NULL,
ALTER COLUMN "transactionId" SET NOT NULL,
ADD CONSTRAINT "Payment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "FlightReservation_paymentId_idx" ON "FlightReservation"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "FlightReservation_flightId_seatNumber_key" ON "FlightReservation"("flightId", "seatNumber");

-- CreateIndex
CREATE INDEX "HotelBooking_paymentId_idx" ON "HotelBooking"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "HotelRoom_hotelId_roomNumber_key" ON "HotelRoom"("hotelId", "roomNumber");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_transactionId_idx" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_referenceId_idx" ON "Payment"("referenceId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- AddForeignKey
ALTER TABLE "FlightReservation" ADD CONSTRAINT "FlightReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightReservation" ADD CONSTRAINT "FlightReservation_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightReservation" ADD CONSTRAINT "FlightReservation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelRoom" ADD CONSTRAINT "HotelRoom_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelBooking" ADD CONSTRAINT "HotelBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelBooking" ADD CONSTRAINT "HotelBooking_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "HotelRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelBooking" ADD CONSTRAINT "HotelBooking_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
