IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'planning')
    EXEC('CREATE SCHEMA planning');
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TravelPlans' AND schema_id = SCHEMA_ID('planning'))
BEGIN
    CREATE TABLE planning.TravelPlans (
        Id          UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID(),
        UserId      UNIQUEIDENTIFIER    NOT NULL,
        Name        NVARCHAR(200)       NOT NULL,
        Description NVARCHAR(1000)      NULL,
        StartDate   DATE                NOT NULL,
        EndDate     DATE                NOT NULL,
        Budget      DECIMAL(18,2)       NOT NULL DEFAULT 0,
        Notes       NVARCHAR(2000)      NULL,
        CreatedAt   DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt   DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT PK_TravelPlans PRIMARY KEY (Id),
        CONSTRAINT CK_TravelPlans_Dates CHECK (EndDate >= StartDate),
        CONSTRAINT CK_TravelPlans_Budget CHECK (Budget >= 0)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Destinations' AND schema_id = SCHEMA_ID('planning'))
BEGIN
    CREATE TABLE planning.Destinations (
        Id              UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID(),
        TravelPlanId    UNIQUEIDENTIFIER    NOT NULL,
        Name            NVARCHAR(200)       NOT NULL,
        Location        NVARCHAR(300)       NOT NULL,
        ArrivalDate     DATE                NOT NULL,
        DepartureDate   DATE                NOT NULL,
        Description     NVARCHAR(1000)      NULL,
        CreatedAt       DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT PK_Destinations PRIMARY KEY (Id),
        CONSTRAINT FK_Destinations_TravelPlans FOREIGN KEY (TravelPlanId) REFERENCES planning.TravelPlans(Id) ON DELETE CASCADE,
        CONSTRAINT CK_Destinations_Dates CHECK (DepartureDate >= ArrivalDate)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Activities' AND schema_id = SCHEMA_ID('planning'))
BEGIN
    CREATE TABLE planning.Activities (
        Id              UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID(),
        TravelPlanId    UNIQUEIDENTIFIER    NOT NULL,
        DestinationId   UNIQUEIDENTIFIER    NULL,
        Name            NVARCHAR(200)       NOT NULL,
        Date            DATE                NOT NULL,
        Time            TIME                NULL,
        Location        NVARCHAR(300)       NULL,
        Description     NVARCHAR(1000)      NULL,
        EstimatedCost   DECIMAL(18,2)       NULL,
        Status          NVARCHAR(20)        NOT NULL DEFAULT 'Planned',
        CreatedAt       DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT PK_Activities PRIMARY KEY (Id),
        CONSTRAINT FK_Activities_TravelPlans FOREIGN KEY (TravelPlanId) REFERENCES planning.TravelPlans(Id) ON DELETE CASCADE,
        CONSTRAINT FK_Activities_Destinations FOREIGN KEY (DestinationId) REFERENCES planning.Destinations(Id) ON DELETE NO ACTION,
        CONSTRAINT CK_Activities_Status CHECK (Status IN ('Planned', 'Reserved', 'Completed', 'Cancelled')),
        CONSTRAINT CK_Activities_EstimatedCost CHECK (EstimatedCost IS NULL OR EstimatedCost >= 0)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChecklistItems' AND schema_id = SCHEMA_ID('planning'))
BEGIN
    CREATE TABLE planning.ChecklistItems (
        Id              UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWID(),
        TravelPlanId    UNIQUEIDENTIFIER    NOT NULL,
        Name            NVARCHAR(300)       NOT NULL,
        IsCompleted     BIT                 NOT NULL DEFAULT 0,
        OrderIndex      INT                 NOT NULL DEFAULT 0,
        CreatedAt       DATETIME2           NOT NULL DEFAULT GETUTCDATE(),

        CONSTRAINT PK_ChecklistItems PRIMARY KEY (Id),
        CONSTRAINT FK_ChecklistItems_TravelPlans FOREIGN KEY (TravelPlanId) REFERENCES planning.TravelPlans(Id) ON DELETE CASCADE
    );
END
GO
