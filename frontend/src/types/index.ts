export type ProjectRole = 'owner' | 'editor' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  authProviders: ('google' | 'github')[];
  createdAt: string;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  platformId: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  path: string;
  content: string;
  language: string;
  updatedAt: string;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  label: string;
  filesSnapshot: Record<string, string>;
  createdBy: string;
  createdAt: string;
  reason: 'autosave' | 'manual' | 'restore';
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: ProjectRole;
  invitedAt: string;
}

export type AutosaveStatus = 'saved' | 'saving' | 'offline' | 'error';

export interface McuDefinition {
  name: string;
  architecture: string;
  flashBytes: number;
  ramBytes: number;
  eepromBytes: number | null;
}

export interface PeripheralCapabilities {
  gpio: boolean;
  adc: boolean;
  pwm: boolean;
  uart: boolean;
  spi: boolean;
  i2c: boolean;
  can: boolean;
  usb: boolean;
  jtag: boolean;
  swd: boolean;
  networking: boolean;
}

export interface Platform {
  id: string;
  boardName: string;
  manufacturer: string;
  mcu: McuDefinition;
  peripherals: PeripheralCapabilities;
  uploadMethod: string;
  supportsOta: boolean;
  supportsDebug: boolean;
  requiredToolchainId: string;
  isImplemented: boolean;
}

export interface Toolchain {
  id: string;
  name: string;
  version: string;
  targetArchitecture: string;
  supportedPlatformIds: string[];
  isInstalled: boolean;
}
