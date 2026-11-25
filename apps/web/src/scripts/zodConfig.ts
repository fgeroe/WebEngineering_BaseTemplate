// zod speeds up object parsing with generated code (new Function). The CSP in
// nginx.conf forbids eval, so zod's probe for it would show up as a CSP
// violation in the console. Without the optimisation there is no probe.
// Must be the first import in main.tsx: schemas check the setting when created.
import { z } from 'zod';

z.config({ jitless: true });
