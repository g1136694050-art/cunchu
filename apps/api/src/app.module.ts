import { Module } from '@nestjs/common';
import { AlertsModule } from './alerts/alerts.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ItemsModule } from './items/items.module';
import { LocationsModule } from './locations/locations.module';
import { PrismaModule } from './prisma/prisma.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CategoriesModule,
    LocationsModule,
    ItemsModule,
    UploadsModule,
    AlertsModule,
  ],
})
export class AppModule {}
