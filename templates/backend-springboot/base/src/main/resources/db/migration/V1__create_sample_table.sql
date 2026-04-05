-- Sample table demonstrating the recommended Flyway migration pattern.
-- Replace with your actual domain tables. Delete this migration when no longer needed.

CREATE TABLE samples (
    id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    code          VARCHAR(20)      NOT NULL,
    name          NVARCHAR(100)    NOT NULL,
    description   NVARCHAR(500)    NULL,
    status        VARCHAR(20)      NOT NULL DEFAULT 'ACTIVE',
    version       BIGINT           NOT NULL DEFAULT 0,
    created_at    DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    updated_at    DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
    created_by    VARCHAR(100)     NULL,
    updated_by    VARCHAR(100)     NULL,

    CONSTRAINT pk_samples PRIMARY KEY (id),
    CONSTRAINT uq_samples_code UNIQUE (code)
);

CREATE INDEX idx_sample_code ON samples (code);
