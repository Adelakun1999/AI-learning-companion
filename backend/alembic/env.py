

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from core.config import settings
from db.models import Base    



config = context.config

# Inject our real DATABASE_URL from .env into Alembic's config object.
# This is THE key line that links Alembic to the same database our
# FastAPI app uses — no hardcoded URL in alembic.ini needed.
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# target_metadata tells Alembic's "autogenerate" feature what your
# models SHOULD look like, so it can diff against the real DB and
# generate the migration code for you automatically.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Generate SQL without a live DB connection (rarely used by us)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """The actual migration logic, run with a real (sync-style) connection."""
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """
    Build our async engine and bridge it into Alembic's sync-style API.

    connection.run_sync(do_run_migrations) is the bridge: it lets us
    call sync-style Alembic code from inside an async connection.
    """
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,  # migrations are one-off, no pooling needed
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Entry point for 'online' mode — the normal case when running
    'alembic upgrade head' against a live database."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()