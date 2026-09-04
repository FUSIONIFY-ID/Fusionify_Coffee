import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { normalizeSupportedPhone } from '../auth/phone.util';
import { PrismaService } from '../database/prisma.service';
import type { SaveAddressInput } from './addresses.types';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.savedAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async create(userId: string, input: SaveAddressInput) {
    const data = this.validateInput(input);
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.savedAddress.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.savedAddress.create({ data: { userId, ...data } });
    });
  }

  async update(userId: string, addressId: string, input: SaveAddressInput) {
    const existing = await this.prisma.savedAddress.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) throw new NotFoundException('Saved address not found.');
    const data = this.validateInput(input);
    return this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.savedAddress.updateMany({
          where: { userId, isDefault: true, id: { not: existing.id } },
          data: { isDefault: false },
        });
      }
      return tx.savedAddress.update({ where: { id: existing.id }, data });
    });
  }

  async remove(userId: string, addressId: string) {
    const existing = await this.prisma.savedAddress.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) throw new NotFoundException('Saved address not found.');
    await this.prisma.savedAddress.delete({ where: { id: existing.id } });
    return { success: true };
  }

  async quote(userId: string, addressId: string, outletId: string) {
    const [address, outlet] = await Promise.all([
      this.prisma.savedAddress.findFirst({
        where: { id: addressId, userId },
      }),
      this.prisma.outlet.findUnique({ where: { id: outletId } }),
    ]);
    if (!address) throw new NotFoundException('Saved address not found.');
    if (!outlet) throw new NotFoundException('Outlet not found.');
    if (
      !outlet.deliveryEnabled ||
      outlet.latitude == null ||
      outlet.longitude == null ||
      outlet.deliveryRadiusMeters == null
    ) {
      return {
        serviceable: false,
        reason: 'delivery_not_configured',
        outletId: outlet.id,
      };
    }

    const distanceMeters = Math.round(
      this.distanceMeters(
        outlet.latitude,
        outlet.longitude,
        address.latitude,
        address.longitude,
      ),
    );
    const serviceable = distanceMeters <= outlet.deliveryRadiusMeters;
    const fee = serviceable
      ? outlet.deliveryBaseFee +
        Math.ceil(distanceMeters / 1000) * outlet.deliveryPerKmFee
      : null;
    return {
      serviceable,
      reason: serviceable ? null : 'outside_delivery_radius',
      outletId: outlet.id,
      addressId: address.id,
      distanceMeters,
      radiusMeters: outlet.deliveryRadiusMeters,
      fee,
      currency: outlet.currency,
    };
  }

  private validateInput(input: SaveAddressInput) {
    const label = this.requiredText(input.label, 'label', 40);
    const recipientName = this.requiredText(
      input.recipientName,
      'recipientName',
      80,
    );
    const line1 = this.requiredText(input.line1, 'line1', 160);
    const city = this.requiredText(input.city, 'city', 80);
    const phone = normalizeSupportedPhone(input.country, input.phone);
    if (
      typeof input.latitude !== 'number' ||
      !Number.isFinite(input.latitude) ||
      input.latitude < -90 ||
      input.latitude > 90 ||
      typeof input.longitude !== 'number' ||
      !Number.isFinite(input.longitude) ||
      input.longitude < -180 ||
      input.longitude > 180
    ) {
      throw new BadRequestException(
        'Valid latitude and longitude are required.',
      );
    }
    return {
      label,
      recipientName,
      phoneE164: phone.e164,
      country: input.country,
      line1,
      line2: input.line2?.trim().slice(0, 160) || null,
      city,
      region: input.region?.trim().slice(0, 80) || null,
      postalCode: input.postalCode?.trim().slice(0, 20) || null,
      latitude: input.latitude,
      longitude: input.longitude,
      deliveryNotes: input.deliveryNotes?.trim().slice(0, 240) || null,
      isDefault: input.isDefault ?? false,
    };
  }

  private requiredText(value: string, field: string, max: number) {
    const text = value?.trim();
    if (!text || text.length > max) {
      throw new BadRequestException(`${field} is required.`);
    }
    return text;
  }

  private distanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const radius = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
