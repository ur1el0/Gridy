from celery.utils import text
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class QueueConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """
        Triggerd when the React frontend attempts to establish a WebSocket connection.
        """

        # The unique group name used to broadcast messages
        self.group_name = 'queue_updates'

        # Join the Redis group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        # Accept the WebSocket connection
        await self.accept()
    
    async def disconnect(self, close_code):
        """
        Triggered when the browser is closed or the connection drops.
        """

        # Leave teh Redis group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def queue_update(self, event):
        """
        This is a custom event handler. Whenever a Django View fires a message 
        with type='queue.update', this function is automatically called.
        """

        # Send a JSON payload down the WebSocket to the React frontend
        await self.send(text_data=json.dumps({
            'type': 'queue_update',
            'message': 'Data has changed. Please refetch.'
        }))