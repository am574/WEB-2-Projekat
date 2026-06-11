using System.Text.Json;
using System.Text.Json.Serialization;

namespace TravelPlanService.Infrastructure;

public class TimeOnlyJsonConverter : JsonConverter<TimeOnly?>
{
    public override TimeOnly? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrEmpty(value)) return null;
        if (TimeOnly.TryParse(value, out var result)) return result;
        return null;
    }

    public override void Write(Utf8JsonWriter writer, TimeOnly? value, JsonSerializerOptions options)
    {
        if (value.HasValue)
            writer.WriteStringValue(value.Value.ToString("HH:mm"));
        else
            writer.WriteNullValue();
    }
}
