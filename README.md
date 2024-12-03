# BitTorrent Implementation

This project is an implementation of the BitTorrent protocol. It includes functionalities for both the client and server sides of the protocol, allowing for the downloading and seeding of torrent files.

## Project Structure
/
├── main.js               # Entry point for the Electron application
├── preload.js            # Preload script for Electron
├── src/
│   └── Peer/
│       ├── Client/       # Client-side logic for handling torrent downloads, piece management, and peer communication
│       └── Server/       # Server-side logic for handling peer connections and managing the tracker
│   └── Tracker/          # Tracker server implementation
├── public/               # Static assets like CSS and JavaScript files for the frontend
├── pages/                # HTML files for different pages of the application



## Installation
Install dependencies:
    ```sh
    npm install
    ```

## Usage

### Running the Application
First, start tracker:
```sh
cd src/Tracker
node server.js
```

To start the application with seeder role, run:
```sh
npm start
```
To start the application with leecher role, run:
```sh
npm start -- 1
```
where 1 is "received1" that contain downloaded file (you can choose other number)

### Features
#### Client-Side
- **Downloading Torrent Files**: Users can download files using torrent links or .torrent files.
- **Seeding Torrent Files**: Users can share downloaded files with others by seeding them back into the network.
- **Handling Peer Connections**: The application establishes peer connections and manages data transfer between peers.

#### Server-Side
- **Tracker Implementation**: The server ensures effective management of peer lists for torrent files.
- **Handling Peer Announcements**: The server responds to peers announcing their presence and shares relevant metadata.
- **Scrape Requests**: The server manages scrape requests to provide updated statistics on torrent health and peer availability.


## Contributing

Contributions to enhance the application are welcome! If you have suggestions, improvements, or bug fixes, please follow these steps:

1. **Open an Issue**: Before submitting a pull request, consider opening an issue to discuss your proposed changes.
2. **Submit a Pull Request**: After making your changes, submit a pull request with a clear description of the modifications.

## License

This project is licensed under the ISC License. You can view the full license in the [LICENSE](LICENSE) file.

## Contact

If you have any questions or encounter issues, please feel free to open an issue on [GitHub]