-- puntoEmision debe ser texto. Como entero, 002 se guarda como 2.
ALTER TABLE `invoice_ranges` MODIFY `puntoEmision` VARCHAR(16) NOT NULL;

-- Rangos ya guardados como "2" o "02" vuelven a 3 dígitos.
UPDATE `invoice_ranges`
SET `puntoEmision` = LPAD(`puntoEmision`, 3, '0')
WHERE `puntoEmision` REGEXP '^[0-9]{1,2}$';

-- Facturas legales ya emitidas: "2-01-00000015" o "002-01-00000015" → "000-002-01-00000015".
-- No toca un número que ya tiene establecimiento ("000-002-01-...").
UPDATE `invoices`
SET `numeroDocumento` = CONCAT(
  '000-',
  LPAD(SUBSTRING_INDEX(`numeroDocumento`, '-', 1), 3, '0'),
  SUBSTRING(`numeroDocumento`, LOCATE('-', `numeroDocumento`))
)
WHERE `type` = 'legal'
  AND `numeroDocumento` REGEXP '^[0-9]{1,3}-[0-9]{2}-[0-9]{8}$';
