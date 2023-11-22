# Webex Devices CDRs

![RoomOS10-Yes](https://img.shields.io/badge/RoomOS%2010-Compatible-green.svg?style=for-the-badge&logo=cisco) ![RoomOS11-Yes](https://img.shields.io/badge/RoomOS%2011-Compatible-green.svg?style=for-the-badge&logo=cisco)

Macro to send Call Detailled Reports to a cloud destination 
Allows data to be posted to a Webex Space, or to a HTTP Server (such as Power Bi)

Does not require all questions to be completed for data to be captured, any data entered will be used for processing.

The following items are needed, depending on the enabled services.

**Webex Space**
- A Webex Bot - create at [developer.webex.com](https://developer.webex.com/my-apps/new/bot) 
- An existing Webex Space with the Webex bot as a member.
- The RoomId of the destination Webex space. These example methods can be used to get the Room Id
  - Using the [List Rooms](https://developer.webex.com/docs/api/v1/rooms/list-rooms) Developer API
  - Adding `astronaut@webex.bot` to the space (bot will leave and 1:1 you the Id)


**HTTP JSON**
- A remote service capable of receiving HTTP POST messages, including Power BI Streaming Dataset.
- (Example) [CSV Server](https://github.com/jeremywillans/csv-server) can be used to test receiving messages and storing them in a CSV File
- The following format is used for the JSON Message
  ```
  [ 
    { 
      CallId: '32',
      CallRate: '3072',
      CallType: 'Video',
      CauseCode: '0',
      CauseOrigin: 'Internal',
      CauseString: '',
      CauseType: 'LocalDisconnect',
      CauseValue: '1',
      DisplayName: 'Joe Doe',
      Duration: 0,
      Encryption: 'Auto',
      OrigCallDirection: 'outgoing',
      PeopleCountAverage: '-1',
      Protocol: 'Spark',
      RemoteURI: 'spark:xxxxx-8887-11ee-9dbd-024263e3ac96',
      RequestedURI: 'bc@xxxxx.calls.webex.com',
      id: '1',
      system: 'stcohen-home-DX70',
      destination: false 
    }
  ]
  **Note:** If enabling the Power Bi option, the timestamp (normally EPOC) is modified to the 'DateTime' format which is supported for the streaming dataset.
  ```


## Deployment

1. Download the Macro file and upload to your Webex device. 
   Note you can use ce-deploy for bulk deployments on modern devices https://github.com/voipnorm/CE-Deploy 
2. Update the Parameters and Enabled Services, outlined at the top of the Macro
3. Make a test call! (noting the Call Duration value before the survey is displayed)

## Debugging

The macro contains two events for testing the Survey without the need to make outbound calls.

These can be invoked by creating an Action button from the UI Extensions Editor and setting the Id as follows:
- `test_services` - Using sample call and survey data, this will trigger processing the enabled services

## Support

In case you've found a bug, please [open an issue on GitHub](../../../issues).

## Disclaimer

This macro is NOT guaranteed to be bug free and production quality.

## Credits

- [CiscoDevNet](https://github.com/CiscoDevNet) for creating [roomdevices-macros-samples](https://github.com/CiscoDevNet/roomdevices-macros-samples)
- ... and [jeremywillans] (https://github.com/jeremywillans/roomos-macros) on which this Macro is based on
