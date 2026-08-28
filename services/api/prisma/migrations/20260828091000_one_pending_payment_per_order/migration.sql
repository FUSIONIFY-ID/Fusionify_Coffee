CREATE UNIQUE INDEX "Payment_one_pending_per_order"
ON "Payment"("orderId")
WHERE "status" = 'PENDING';
