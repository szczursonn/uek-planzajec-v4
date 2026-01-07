import * as z from 'zod/mini';
import { compress, createLocalStorageState, decompress } from './manager';

const dataCacheSchema = z.array(
    z.tuple([
        z.string(),
        z.object({
            lastUsedAt: z.number().check(z.nonnegative()),
            value: z.unknown(),
        }),
    ]),
);

export const swrDataCacheGlobalState = createLocalStorageState(
    'swrDataCache',
    (encodedValue) => {
        let unparsed;
        try {
            unparsed = JSON.parse(decompress(encodedValue));
        } catch (_) {
            unparsed = null;
        }

        return new Map(dataCacheSchema.safeParse(unparsed).data);
    },
    (value) => compress(JSON.stringify(Array.from(value.entries()))),
);
