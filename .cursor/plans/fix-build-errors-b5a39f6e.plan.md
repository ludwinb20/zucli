<!-- b5a39f6e-f03d-439d-8bed-70035bb20adb 6199c380-d9d7-4185-8cbb-90066d4fd0e6 -->
# Fix All Build Errors

## Approach

1. Run `pnpm build` to identify TypeScript errors
2. Fix each error systematically by:

- Adding missing type definitions
- Correcting type mismatches
- Adding necessary type casts
- Fixing import/export issues

3. Repeat the build process until no errors remain

## Key Areas to Address

Based on the recent fixes, potential remaining issues may include:

- Missing or incorrect type definitions in component props
- Type mismatches in API routes
- Import/export consistency issues
- Missing properties in type definitions
- Incorrect `any` types that need proper typing

## Implementation Steps

1. Execute `pnpm build` in the project root
2. Parse build output for errors
3. Fix errors one at a time or in logical groups
4. Re-run `pnpm build` after each fix
5. Continue until build succeeds with exit code 0

## Success Criteria

- `pnpm build` completes without TypeScript errors
- All type definitions are correct
- No `any` types remain (unless explicitly necessary)

### To-dos

- [ ] Corregir imports no utilizados en modales (AppointmentModal, ChangeSpecialtyModal, ChangeStatusModal, PatientModal, etc.)
- [ ] Corregir imports no utilizados en componentes UI (CompactItemSelector, SpecialtyDatePicker, WeekDaySelector, etc.)
- [ ] Envolver loadVariants en useCallback y corregir useEffect dependencies
- [ ] Corregir variables no utilizadas en UsersPageExample
- [ ] Ejecutar build final y verificar cero warnings