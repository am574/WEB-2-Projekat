IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'auth')
    EXEC('CREATE SCHEMA auth');
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users' AND schema_id = SCHEMA_ID('auth'))
BEGIN
    CREATE TABLE auth.Users (
        Id              UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID(),
        FirstName       NVARCHAR(100)       NOT NULL,
        LastName        NVARCHAR(100)       NOT NULL,
        Email           NVARCHAR(255)       NOT NULL,
        PasswordHash    NVARCHAR(500)       NOT NULL,
        Role            NVARCHAR(20)        NOT NULL DEFAULT 'User',
        CreatedAt       DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT PK_Users PRIMARY KEY (Id),
        CONSTRAINT UQ_Users_Email UNIQUE (Email),
        CONSTRAINT CK_Users_Role CHECK (Role IN ('User', 'Admin'))
    );
END
GO
