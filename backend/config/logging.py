import logging
import json
from datetime import datetime, timezone

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "filename": record.filename,
            "lineno": record.lineno
        }

        # Format exceptions dynamically if they exist
        if record.exc_info:
            log_record["exc_info"] = self.formatException(record.exc_info)

        return json.dumps(log_record)
        