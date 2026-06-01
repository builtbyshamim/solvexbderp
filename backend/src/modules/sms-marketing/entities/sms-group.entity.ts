import { Column, Entity, OneToMany } from 'typeorm';
import { TenantBaseEntity } from 'src/common/entities/tenant-base.entity';

@Entity('sms_groups')
export class SmsGroupEntity extends TenantBaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 0 })
  memberCount: number;
}

@Entity('sms_group_members')
export class SmsGroupMemberEntity extends TenantBaseEntity {
  @Column()
  groupId: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  customerId: string;
}
