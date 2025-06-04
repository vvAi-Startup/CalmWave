from marshmallow import Schema, fields, validate

class AudioUploadSchema(Schema):
    # Schema para validação da requisição de upload (não usa para o arquivo, mas para dados JSON se houvesse)
    # Como o arquivo é enviado via multipart/form-data, Marshmallow não valida o arquivo diretamente aqui.
    # Mas se você tivesse outros campos como 'intensity', validaria aqui.
    # Por enquanto, apenas um placeholder para o nome do arquivo, que será obtido da requisição.
    filename = fields.Str(dump_only=True) # Para saída

# RENOMEADO: De AudioProcessSchema para AudioProcessResponseSchema
class AudioProcessResponseSchema(Schema):
    upload_id = fields.Str(required=True)
    status = fields.Str(required=False)
    message = fields.Str(required=False)
    processed_audio_url = fields.Str(required=False, allow_none=True)
    
class AudioListSchema(Schema):
    id = fields.Str(required=True)
    session_id = fields.Str(required=True)
    filename = fields.Str(required=True)
    path = fields.Str(required=True)
    created_at = fields.DateTime(required=True)
    title = fields.Str(required=False)
    status = fields.Str(required=False)
    message = fields.Str(required=False)

# RENOMEADO: De denoiseAudioSchema para DenoiseServiceResponseSchema
class DenoiseServiceResponseSchema(Schema):
    status = fields.Str(required=True)
    message = fields.Str(required=False)
    path = fields.Str(required=False, allow_none=True)
