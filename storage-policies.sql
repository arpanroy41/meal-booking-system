-- Storage Policies for Payment QR Code
-- Run this in Supabase SQL Editor after creating the 'payment-qr' storage bucket

-- Policy: Allow authenticated users to view payment QR code
DROP POLICY IF EXISTS "Authenticated users can view payment QR" ON storage.objects;
CREATE POLICY "Authenticated users can view payment QR"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-qr' 
  AND auth.role() = 'authenticated'
);

-- Policy: Allow admins to upload/update payment QR code
DROP POLICY IF EXISTS "Admins can manage payment QR" ON storage.objects;
CREATE POLICY "Admins can manage payment QR"
ON storage.objects FOR ALL
USING (
  bucket_id = 'payment-qr' 
  AND EXISTS (
    SELECT 1 FROM employees
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Note: Make sure the 'payment-qr' bucket exists and is PRIVATE (not public)
