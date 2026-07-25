"""Initial schema — all tables

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-06-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Agents ---
    op.create_table(
        "agents",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(200), nullable=False),
        sa.Column("phone", sa.String(30), nullable=False),
        sa.Column("avatar", sa.String(500), nullable=False),
        sa.Column("title", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_agents")),
        sa.UniqueConstraint("email", name=op.f("uq_agents_email")),
    )
    op.create_index(op.f("ix_agents_email"), "agents", ["email"])

    # --- Properties ---
    property_type_enum = sa.Enum("house", "apartment", "condo", "townhouse", "villa", name="property_type_enum")
    property_status_enum = sa.Enum("for_sale", "for_rent", "sold", "pending", name="property_status_enum")

    op.create_table(
        "properties",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("address", sa.String(300), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("state", sa.String(100), nullable=False),
        sa.Column("zip_code", sa.String(20), nullable=False),
        sa.Column("country", sa.String(100), server_default="United States"),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("bedrooms", sa.Integer(), nullable=False),
        sa.Column("bathrooms", sa.Integer(), nullable=False),
        sa.Column("area", sa.Integer(), nullable=False),
        sa.Column("property_type", property_type_enum, nullable=False),
        sa.Column("status", property_status_enum, nullable=False, server_default="for_sale"),
        sa.Column("year_built", sa.Integer(), nullable=False),
        sa.Column("agent_id", sa.Uuid(), sa.ForeignKey("agents.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_properties")),
        sa.CheckConstraint("price > 0", name=op.f("ck_properties_positive_price")),
    )
    op.create_index(op.f("ix_properties_price"), "properties", ["price"])
    op.create_index(op.f("ix_properties_city"), "properties", ["city"])
    op.create_index(op.f("ix_properties_state"), "properties", ["state"])
    op.create_index(op.f("ix_properties_bedrooms"), "properties", ["bedrooms"])
    op.create_index(op.f("ix_properties_property_type"), "properties", ["property_type"])
    op.create_index(op.f("ix_properties_agent_id"), "properties", ["agent_id"])
    op.create_index(op.f("ix_properties_created_at"), "properties", ["created_at"])

    # --- Property Images ---
    op.create_table(
        "property_images",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("property_id", sa.Uuid(), sa.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_property_images")),
    )
    op.create_index(op.f("ix_property_images_property_id"), "property_images", ["property_id"])

    # --- Property Features ---
    op.create_table(
        "property_features",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("property_id", sa.Uuid(), sa.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_property_features")),
    )
    op.create_index(op.f("ix_property_features_property_id"), "property_features", ["property_id"])

    # --- Inquiries ---
    op.create_table(
        "inquiries",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(200), nullable=False),
        sa.Column("phone", sa.String(30), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("property_id", sa.Uuid(), sa.ForeignKey("properties.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_inquiries")),
    )
    op.create_index(op.f("ix_inquiries_property_id"), "inquiries", ["property_id"])

    # --- Blog Posts ---
    op.create_table(
        "blog_posts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(300), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("excerpt", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("cover_image", sa.String(500), nullable=False),
        sa.Column("author_name", sa.String(100), nullable=False),
        sa.Column("author_avatar", sa.String(500), nullable=False),
        sa.Column("author_role", sa.String(100), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("read_time", sa.Integer(), nullable=False),
        sa.Column("published_at", sa.String(50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_blog_posts")),
        sa.UniqueConstraint("slug", name=op.f("uq_blog_posts_slug")),
    )
    op.create_index(op.f("ix_blog_posts_slug"), "blog_posts", ["slug"])
    op.create_index(op.f("ix_blog_posts_published_at"), "blog_posts", ["published_at"])

    # --- Blog Tags ---
    op.create_table(
        "blog_tags",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("blog_post_id", sa.Uuid(), sa.ForeignKey("blog_posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tag", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_blog_tags")),
    )
    op.create_index(op.f("ix_blog_tags_blog_post_id"), "blog_tags", ["blog_post_id"])


def downgrade() -> None:
    op.drop_table("blog_tags")
    op.drop_table("blog_posts")
    op.drop_table("inquiries")
    op.drop_table("property_features")
    op.drop_table("property_images")
    op.drop_table("properties")
    op.drop_table("agents")

    # Drop enums
    sa.Enum(name="property_type_enum").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="property_status_enum").drop(op.get_bind(), checkfirst=True)
