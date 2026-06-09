IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'sharing')
    EXEC('CREATE SCHEMA sharing');
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ShareTokens' AND schema_id = SCHEMA_ID('sharing'))
BEGIN
    CREATE TABLE sharing.ShareTokens (
        Id              UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID(),
        TravelPlanId    UNIQUEIDENTIFIER    NOT NULL,
        Token           NVARCHAR(500)       NOT NULL,
        AccessType      NVARCHAR(10)        NOT NULL,
        CreatedAt       DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        ExpiresAt       DATETIME2           NULL,

        CONSTRAINT PK_ShareTokens PRIMARY KEY (Id),
        CONSTRAINT UQ_ShareTokens_Token UNIQUE (Token),
        CONSTRAINT CK_ShareTokens_AccessType CHECK (AccessType IN ('VIEW', 'EDIT'))
    );
END
GO
