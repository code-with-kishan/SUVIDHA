import { randomInt } from 'crypto';

const MAX_ATTEMPTS = 300;

const create4Digit = () => String(randomInt(1000, 10000));

export const generateUniqueReferenceCode = async (prisma) => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const referenceCode = create4Digit();

    const [serviceMatch, complaintMatch] = await Promise.all([
      prisma.serviceRequest.findFirst({ where: { referenceCode }, select: { id: true } }),
      prisma.complaint.findFirst({ where: { referenceCode }, select: { id: true } })
    ]);

    if (!serviceMatch && !complaintMatch) {
      return referenceCode;
    }
  }

  throw new Error('Unable to generate unique 4-digit reference code. Please retry.');
};
