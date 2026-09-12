import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1788878777654 implements MigrationInterface {
    name = 'Init1788878777654'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying, "email_verified_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "oauth_accounts" ("id" SERIAL NOT NULL, "provider" character varying NOT NULL, "provider_user_id" character varying NOT NULL, "provider_email" character varying NOT NULL, "linked_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "UQ_ea7720e04e3ae1278575c3159cf" UNIQUE ("provider", "provider_user_id"), CONSTRAINT "PK_710a81523f515b78f894e33bb10" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "password_reset_tokens" ("id" SERIAL NOT NULL, "token_hash" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL, "used_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "UQ_91185d86d5d7557b19abbb2868b" UNIQUE ("token_hash"), CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" SERIAL NOT NULL, "token_hash" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL, "revoked_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "UQ_a7838d2ba25be1342091b6695f1" UNIQUE ("token_hash"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "oauth_accounts" ADD CONSTRAINT "FK_22a05e92f51a983475f9281d3b0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c"`);
        await queryRunner.query(`ALTER TABLE "oauth_accounts" DROP CONSTRAINT "FK_22a05e92f51a983475f9281d3b0"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
        await queryRunner.query(`DROP TABLE "oauth_accounts"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
