import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

import prisma from '@/lib/prisma';

// Mock Prisma Client
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

// Export the mocked prisma instance with proper typing
export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// Reset mock before each test
beforeEach(() => {
  mockReset(prismaMock);
});

