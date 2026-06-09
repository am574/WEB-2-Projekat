IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'expense')
    EXEC('CREATE SCHEMA expense');
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Expenses' AND schema_id = SCHEMA_ID('expense'))
BEGIN
    CREATE TABLE expense.Expenses (
        Id              UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID(),
        TravelPlanId    UNIQUEIDENTIFIER    NOT NULL,
        Name            NVARCHAR(200)       NOT NULL,
        Category        NVARCHAR(50)        NOT NULL,
        Amount          DECIMAL(18,2)       NOT NULL,
        Date            DATE                NOT NULL,
        Description     NVARCHAR(1000)      NULL,
        CreatedAt       DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT PK_Expenses PRIMARY KEY (Id),
        CONSTRAINT CK_Expenses_Category CHECK (Category IN ('Transport', 'Accommodation', 'Food', 'Tickets', 'Shopping', 'Other')),
        CONSTRAINT CK_Expenses_Amount CHECK (Amount >= 0)
    );
END
GO
