const os = require('os');
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const tar = require('tar');

// List of resources with version, URL, and directory
const resources = [
  { version: '', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/libritts/high/en_US-libritts-high.onnx.json', directory: 'voices' },
  { version: '', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/libritts/high/en_US-libritts-high.onnx', directory: 'voices' },
  { version: '', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/high/en_US-ryan-high.onnx.json', directory: 'voices' },
  { version: '', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/high/en_US-ryan-high.onnx', directory: 'voices' },
  { version: '', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json', directory: 'voices' },
  { version: '', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx', directory: 'voices' },
  { version: '', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx.json', directory: 'voices' },
  { version: '', url: 'https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx', directory: 'voices' },
  { version: '', url: 'https://freetestdata.com/wp-content/uploads/2021/09/Free_Test_Data_1MB_MP3.mp3', directory: 'songs' },
  { version: 'arm', url: 'https://github.com/rhasspy/piper/releases/download/v1.1.0/piper_arm64.tar.gz', directory: '' },
  { version: 'x64', url: 'https://github.com/rhasspy/piper/releases/download/v1.1.0/piper_amd64.tar.gz', directory: '' },
  // Add more resources as needed
];

// Function to determine CPU architecture
const getArchitecture = () => {
  const arch = os.arch();
  if (arch === 'x64' || arch === 'x86_64') {
    return 'x64';
  } else if (arch === 'arm' || arch === 'arm64') {
    return 'arm';
  } else {
    throw new Error(`Unsupported architecture: ${arch}`);
  }
};

// Function to download resources based on CPU architecture
const downloadResources = async () => {
  const architecture = getArchitecture();

  // Filter resources based on architecture and universal ones
  const filteredResources = resources.filter(resource => 
    !resource.version || resource.version === architecture
  );

  // Download filtered resources sequentially
  for (const resource of filteredResources) {
    try {
      await downloadResource(resource.url, resource.directory);
      await wait(10000); // Wait for 10 seconds between downloads
    } catch (error) {
      console.error(`Error downloading ${resource.url}: ${error}`);
      cleanupFailedDownload(resource.directory);
    }
  }
};

// Function to download a single resource
const downloadResource = async (url, directory) => {
  const fileName = path.basename(url);
  const downloadDir = path.join(__dirname, 'resources', directory);
  const filePath = path.join(downloadDir, fileName);

  // Create download directory if it doesn't exist
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  console.log(`Downloading ${fileName} to ${downloadDir}`);

  const file = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(`Failed to download ${url}. Status Code: ${response.statusCode}`);
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          if (fileName.endsWith('.tar.gz')) {
            decompressTarGzFile(filePath, downloadDir)
              .then(() => {
                fs.unlinkSync(filePath); // Delete the compressed file after decompression
                resolve();
              })
              .catch((err) => {
                cleanupFailedDownload(directory);
                reject(`Error decompressing ${fileName}: ${err}`);
              });
          } else {
            resolve();
          }
        });
      });
    });

    request.on('error', (err) => {
      fs.unlink(filePath, () => reject(err));
    });
  });
};

// Function to decompress .tar.gz files
const decompressTarGzFile = async (filePath, destDir) => {
  console.log(`Decompressing ${filePath} to ${destDir}`);

  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filePath);
    const writeStream = tar.x({
      file: filePath,
      cwd: destDir
    });

    readStream.pipe(zlib.createGunzip()).pipe(writeStream);

    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
};

// Function to wait for a specified time in milliseconds
const wait = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

// Function to clean up failed download by removing downloaded files
const cleanupFailedDownload = (directory) => {
  const downloadDir = path.join(__dirname, 'resources', directory);
  fs.readdir(downloadDir, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${downloadDir}: ${err}`);
      return;
    }
    files.forEach(file => {
      const filePath = path.join(downloadDir, file);
      fs.unlinkSync(filePath);
      console.log(`Removed ${filePath}`);
    });
  });
};

module.exports = { downloadResources };
