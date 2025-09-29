/* eslint-disable react-native/no-inline-styles */
import {Picker} from '@react-native-picker/picker';
import *s React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Platform,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  BLEPrinter,
  IBLEPrinter,
  ColumnAlignment,
  COMMANDS,
} from '@porlone/rn-thermal-print';
import Loading from '../Loading';
import AntIcon from 'react-native-vector-icons/AntDesign';
import QRCode from 'react-native-qrcode-svg';
import {useRef} from 'react';
import {Buffer} from 'buffer';

export type SelectedPrinter = Partial<IBLEPrinter>;

const deviceWidth = Dimensions.get('window').width;
const EscPosEncoder = require('esc-pos-encoder');

export const HomeScreen = () => {
  const [devices, setDevices] = React.useState<IBLEPrinter[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [selectedPrinter, setSelectedPrinter] = React.useState<SelectedPrinter>({});
  let QrRef = useRef<any>(null);

  const getListDevices = React.useCallback(async () => {
    setLoading(true);
    try {
      await BLEPrinter.init();
      const results = await BLEPrinter.getDeviceList();
      setDevices(results);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    getListDevices();
  }, [getListDevices]);

  const handleConnectSelectedPrinter = async () => {
    if (!selectedPrinter.inner_mac_address) {
      Alert.alert('Connection failed!', 'Please select a printer');
      return;
    }
    setLoading(true);
    try {
      await BLEPrinter.connectPrinter(selectedPrinter.inner_mac_address);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      BLEPrinter.printText('<C>sample text</C>', {
        cut: false,
      });
      BLEPrinter.printImage(
        'https://sportshub.cbsistatic.com/i/2021/04/09/9df74632-fde2-421e-bc6f-d4bf631bf8e5/one-piece-trafalgar-law-wano-anime-1246430.jpg',
      );
      BLEPrinter.printBill('<C>sample text</C>');
    } catch (err) {
      console.warn(err);
    }
  };

  const handlePrintBill = async () => {
    let address = '2700 S123 Grand Ave, Los Angeles, CA 90007223, USA.';
    const BOLD_ON = COMMANDS.TEXT_FORMAT.TXT_BOLD_ON;
    const BOLD_OFF = COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF;
    const CENTER = COMMANDS.TEXT_FORMAT.TXT_ALIGN_CT;
    const OFF_CENTER = COMMANDS.TEXT_FORMAT.TXT_ALIGN_LT;
    try {
      const getDataURL = () => {
        (QrRef as any).toDataURL(callback);
      };
      const callback = async (dataURL: string) => {
        let qrProcessed = dataURL.replace(/(\r\n|\n|\r)/gm, '');
        if (Platform.OS === 'android' || Platform.OS === 'ios') {
          BLEPrinter.printImage(
            `https://sportshub.cbsistatic.com/i/2021/04/09/9df74632-fde2-421e-bc6f-d4bf631bf8e5/one-piece-trafalgar-law-wano-anime-1246430.jpg`,
            {
              imageWidth: 300,
              imageHeight: 300,
            },
          );
          BLEPrinter.printText(`${CENTER}${BOLD_ON} BILLING ${BOLD_OFF}\n`);
          BLEPrinter.printText(`${CENTER}${address}${OFF_CENTER}`);
          BLEPrinter.printText('090 3399 031 555\n');
          BLEPrinter.printText(`Date : 15- 09 - 2021 /15 : 29 : 57 / Admin`);
          BLEPrinter.printText(`Product : Total - 4 / No. (1,2,3,4)\n`);
          BLEPrinter.printText(
            `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR_80MM}${CENTER}`,
          );
          let orderList = [
            ['1. Skirt Palas Labuh Muslimah Fashion', 'x2', '500
],
            ['2. BLOUSE ROPOL VIRAL MUSLIMAH FASHION', 'x4222', '500
],
            [
              '3. Women Crew Neck Button Down Ruffle Collar Loose Blouse',
              'x1',
              '30000000000000
,
            ],
            ['4. Retro Buttons Up Full Sleeve Loose', 'x10', '200
],
            ['5. Retro Buttons Up', 'x10', '200
],
          ];
          let columnAlignment = [
            ColumnAlignment.LEFT,
            ColumnAlignment.CENTER,
            ColumnAlignment.RIGHT,
          ];
          let columnWidth = [46 - (7 + 12), 7, 12];
          const header = ['Product list', 'Qty', 'Price'];
          BLEPrinter.printColumnsText(header, columnWidth, columnAlignment, [
            `${BOLD_ON}`,
            '',
            '',
          ]);
          BLEPrinter.printText(
            `${CENTER}${COMMANDS.HORIZONTAL_LINE.HR3_80MM}${CENTER}`,
          );
          for (let i in orderList) {
            BLEPrinter.printColumnsText(
              orderList[i],
              columnWidth,
              columnAlignment,
              [`${BOLD_OFF}`, '', ''],
            );
          }
          BLEPrinter.printText(`\n`);
          BLEPrinter.printImageBase64(qrProcessed, {
            imageWidth: 50,
            imageHeight: 50,
          });
          BLEPrinter.printBill(`${CENTER}Thank you\n`, {beep: false});
        } else {
          const encoder = new EscPosEncoder();
          let _encoder = encoder
            .initialize()
            .align('center')
            .line('BILLING')
            .qrcode('https://nielsleenheer.com')
            .encode();
          let base64String = Buffer.from(_encoder).toString('base64');
          BLEPrinter.printRaw(base64String);
        }
      };
      getDataURL();
    } catch (err) {
      console.warn(err);
    }
  };

  const handlePrintBillWithImage = async () => {
    BLEPrinter.printImage(
      'https://media-cdn.tripadvisor.com/media/photo-m/1280/1b/3a/bd/b5/the-food-bill.jpg',
      {
        imageWidth: 575,
      },
    );
    BLEPrinter.printBill('', {beep: false});
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text>Select printer: </Text>
        <Picker
          selectedValue={selectedPrinter}
          onValueChange={setSelectedPrinter}>
          {devices.map((item, index) => (
            <Picker.Item
              label={item.device_name}
              value={item}
              key={`printer-item-${index}`}
            />
          ))}
        </Picker>
      </View>
      <View style={styles.section}>
        <View
          style={[
            styles.buttonContainer,
            {
              marginTop: 50,
            },
          ]}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleConnectSelectedPrinter}>
            <AntIcon name={'disconnect'} color={'white'} size={18} />
            <Text style={styles.text}>Connect</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, {backgroundColor: 'blue'}]}
            onPress={handlePrint}>
            <AntIcon name={'printer'} color={'white'} size={18} />
            <Text style={styles.text}>Print sample</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, {backgroundColor: 'blue'}]}
            onPress={handlePrintBill}>
            <AntIcon name={'profile'} color={'white'} size={18} />
            <Text style={styles.text}>Print bill</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, {backgroundColor: 'blue'}]}
            onPress={handlePrintBillWithImage}>
            <AntIcon name={'profile'} color={'white'} size={18} />
            <Text style={styles.text}>Print bill With Image</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.qr}>
          <QRCode value="hey" getRef={(el: any) => (QrRef = el)} />
        </View>
      </View>
      <Loading loading={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {},
  rowDirection: {
    flexDirection: 'row',
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    height: 40,
    width: deviceWidth / 1.5,
    alignSelf: 'center',
    backgroundColor: 'green',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  text: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  title: {
    color: 'black',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  qr: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
});
