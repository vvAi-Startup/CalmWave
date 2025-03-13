create database calmWave;
use calmwave;

create table desenvolvedores(
id_dev int auto_increment,
nome_usuario varchar(20) not null,
senha varchar(15) not null,
nome_completo varchar(100) not null,
email varchar(40) unique not null,
telefone varchar(40) not null, 
tipo_dev int,
primary key(id_dev)
);
create table usuarios(
id_usuario int auto_increment,
nome_usuario varchar(20) not null,
senha varchar(15) not null,
nome_completo varchar(50) not null,
email varchar(40) unique not null,
telefone bigint unique not null, 
primary key(id_usuario)
);
create table suporte(
id_suporte int auto_increment,
chat varchar(300) not null,
usuario int,
dev int,
foreign key(dev) references desenvolvedores(id_dev),
foreign key(usuario) references usuarios(id_usuario),
primary key(id_suporte)
);
create table playlists(
id_playlist int auto_increment,
nome_playlist varchar(50) not null,
criacao_playlist datetime not null,
qtd_musicas int,
tempo_duracao time,
/*dev int,
usuario int,
foreign key(usuario) references usuarios(id_usuario),
foreign key(dev) references desenvolvedores(id_dev),*/
primary key(id_playlist)
);
create table musicas(
id_musica int auto_increment,
nome_musica varchar(100) not null,
nome_musicaCripto varchar(50),
artista varchar(100),
duracao time not null,
ano int,
playlist int,
foreign key(playlist)references playlists(id_playlist),  
primary key(id_musica)
);
create table pasta_ruidos(
id_ruido int auto_increment,
nome_ruido varchar(20) not null,
nome_ruidoCripto varchar(50),
duracao time not null,
frequencia double,
loop_ boolean,
playlist int,
foreign key(playlist)references playlists(id_playlist),  
primary key(id_ruido)
);

-- Inserindo dados na tabela desenvolvedores
INSERT INTO desenvolvedores (nome_usuario, senha, nome_completo, email, telefone, tipo_dev) VALUES
('Dev_Leonardo', 'vvai123', 'Leonardo', 'DevLeo@gmail.com', 1234567890, 1),
('Dev_Marcelo', 'vvai123', 'Marcelo', 'DevMar@gmail.com', 9876543210, 1),
('Dev_Victor', 'vvai123', 'Victor', 'DevVic@gmail.com', 4445556666, 1),
('Dev_Jow', 'vvai123', 'João', 'DevJow@gmail.com', 4445556666, 0),
('Dev_Ant', 'vvai123', 'Antônio', 'DevTon@gmail.com', 4445556666, 0),
('Dev_Pedro', 'vvai123', 'Pedro', 'DevPed@gmail.com', 1112223333, 1),
('Dev_Luiza', 'vvai123', 'Luiza', 'DevLui@gmail.com', 5556667777, 1),
('Dev_Maria', 'vvai123', 'Maria', 'DevMari@gmail.com', 9998887777, 1),
('Dev_Rafaela', 'vvai123', 'Rafaela', 'DevRaf@gmail.com', 3332221111, 0),
('Dev_Bruno', 'vvai123', 'Bruno', 'DevBru@gmail.com', 7778889999, 0)
;

-- Inserindo dados na tabela usuarios
INSERT INTO usuarios (nome_usuario, senha, nome_completo, email, telefone) VALUES
('user1', 'password1', 'José', 'user1@example.com', 5551112222),
('user2', 'password2', 'Amanda', 'user2@example.com', 9998887777),
('user3', 'password3', 'Luisa', 'user3@example.com', 7778889999),
('user4', 'password4', 'Wagner', 'user4@example.com', 6665554444),
('user5', 'password5', 'Carla', 'user5@example.com', 1112223333),
('user6', 'password6', 'Rafael', 'user6@example.com', 4445556666),
('user7', 'password7', 'Ana', 'user7@example.com', 8887776666),
('user8', 'password8', 'Pedro', 'user8@example.com', 2223334444),
('user9', 'password9', 'Mariana', 'user9@example.com', 3334445555),
('user10', 'password10', 'Fernanda', 'user10@example.com', 6667778888),
('user11', 'password11', 'Rodrigo', 'user11@example.com', 9990001111),
('user12', 'password12', 'Juliana', 'user12@example.com', 1234567890),
('user13', 'password13', 'Lucas', 'user13@example.com', 2345678901),
('user14', 'password14', 'Beatriz', 'user14@example.com', 3456789012),
('user15', 'password15', 'Gabriel', 'user15@example.com', 4567890123);


-- Inserindo dados na tabela suporte
INSERT INTO suporte (chat, usuario) VALUES
('Problema técnico', 1),
('Dúvida sobre funcionalidade', 2),
('Problema de login', 3),
('Dúvida sobre pagamento', 4);

-- Inserindo dados na tabela playlists
INSERT INTO playlists (nome_playlist, criacao_playlist, qtd_musicas, tempo_duracao) VALUES
('Rock Classics', NOW(), 10, '03:30:00'),
('Pop Hits', NOW(), 10, '02:00:00'),
('Indie Vibes', NOW(), 10, '01:45:00'),
('Chill Out', NOW(), 10, '02:45:00'),
('Hip-Hop Mix', NOW(), 10, '01:15:00'),
('EDM Party', NOW(), 10, '02:30:00'),
('R&B Soul', NOW(), 10, '01:10:00'),
('Country Roads', NOW(), 10, '01:30:00'),
('Jazz Lounge', NOW(), 10, '02:15:00'),
('Reggae Vibes', NOW(), 10, '01:00:00'),
('Classical Melodies', NOW(), 10, '03:00:00'),
('Metal Mayhem', NOW(), 10, '02:30:00'),
('Funk Grooves', NOW(), 10, '01:45:00'),
('Acoustic Serenade', NOW(), 10, '02:15:00'),
('80s Flashback', NOW(), 10, '02:45:00')
;

-- Inserindo dados na tabela musicas
INSERT INTO musicas (nome_musica, artista, duracao, ano, playlist) VALUES
('Bohemian Rhapsody', 'Queen', '05:55', 1975, 1),
('Hotel California', 'The Eagles', '06:30', 1976, 1),
('Stairway to Heaven', 'Led Zeppelin', '08:02', 1971, 1),
('Sweet Child O’ Mine', 'Guns N’ Roses', '05:55', 1987, 1),
('Smells Like Teen Spirit', 'Nirvana', '04:38', 1991, 1),
('Imagine', 'John Lennon', '03:03', 1971, 1),
('Livin’ on a Prayer', 'Bon Jovi', '04:10', 1986, 1),
('Yesterday', 'The Beatles', '02:05', 1965, 1),
('Don’t Stop Believin’', 'Journey', '04:11', 1981, 1),
('Eye of the Tiger', 'Survivor', '04:05', 1982, 1),

('Shape of You', 'Ed Sheeran', '03:53', 2017, 2),
('Uptown Funk', 'Mark Ronson ft. Bruno Mars', '04:30', 2014, 2),
('Havana', 'Camila Cabello ft. Young Thug', '03:37', 2017, 2),
('Closer', 'The Chainsmokers ft. Halsey', '04:05', 2016, 2),
('Rolling in the Deep', 'Adele', '03:48', 2010, 2),
('Despacito', 'Luis Fonsi ft. Daddy Yankee', '04:41', 2017, 2),
('Cheap Thrills', 'Sia ft. Sean Paul', '03:44', 2016, 2),
('Love Yourself', 'Justin Bieber', '03:53', 2015, 2),
('Roar', 'Katy Perry', '03:42', 2013, 2),
('Can’t Feel My Face', 'The Weeknd', '03:36', 2015, 2),

('Ho Hey', 'The Lumineers', '02:43', 2012, 3),
('Somebody That I Used to Know', 'Gotye ft. Kimbra', '04:04', 2011, 3),
('Take Me Out', 'Franz Ferdinand', '03:57', 2004, 3),
('Pumped Up Kicks', 'Foster the People', '04:00', 2010, 3),
('1901', 'Phoenix', '03:13', 2009, 3),
('Electric Feel', 'MGMT', '03:49', 2007, 3),
('Little Lion Man', 'Mumford & Sons', '04:06', 2009, 3),
('Sweater Weather', 'The Neighbourhood', '04:00', 2013, 3),
('Young Folks', 'Peter Bjorn and John', '04:38', 2006, 3),
('Home', 'Edward Sharpe & The Magnetic Zeros', '05:03', 2009, 3),

('Intro', 'The xx', '02:07', 2009, 4),
('Midnight City', 'M83', '04:03', 2011, 4),
('Clair de Lune', 'Debussy', '05:09', 1890, 4),
('Porcelain', 'Moby', '04:01', 1999, 4),
('Breathe', 'Telepopmusik', '04:40', 2001, 4),
('Teardrop', 'Massive Attack', '05:29', 1998, 4),
('Strawberry Swing', 'Coldplay', '04:09', 2008, 4),
('Heartbeats', 'Jose Gonzalez', '02:41', 2003, 4),
('To Build a Home', 'The Cinematic Orchestra', '06:11', 2007, 4),
('Re: Stacks', 'Bon Iver', '06:41', 2007, 4),

('Juicy', 'The Notorious B.I.G.', '05:02', 1994, 5),
('Lose Yourself', 'Eminem', '05:20', 2002, 5),
('Sicko Mode', 'Travis Scott', '05:12', 2018, 5),
('Hotline Bling', 'Drake', '04:27', 2015, 5),
('Gold Digger', 'Kanye West ft. Jamie Foxx', '03:28', 2005, 5),
('HUMBLE.', 'Kendrick Lamar', '03:04', 2017, 5),
('Empire State of Mind', 'Jay-Z ft. Alicia Keys', '04:36', 2009, 5),
('Good Life', 'Kanye West ft. T-Pain', '03:27', 2007, 5),
('In Da Club', '50 Cent', '03:13', 2003, 5),
('Black and Yellow', 'Wiz Khalifa', '03:37', 2010, 5),

('Don’t You Worry Child', 'Swedish House Mafia', '05:33', 2012, 6),
('Wake Me Up', 'Avicii', '04:09', 2013, 6),
('Titanium', 'David Guetta ft. Sia', '04:05', 2011, 6),
('Animals', 'Martin Garrix', '05:04', 2013, 6),
('Lean On', 'Major Lazer & DJ Snake ft. MØ', '02:57', 2015, 6),
('Scary Monsters and Nice Sprites', 'Skrillex', '04:03', 2010, 6),
('Levels', 'Avicii', '03:22', 2011, 6),
('Clarity', 'Zedd ft. Foxes', '04:31', 2012, 6),
('This Is What You Came For', 'Calvin Harris ft. Rihanna', '03:41', 2016, 6),
('All Night', 'Steve Aoki & Lauren Jauregui', '03:26', 2017, 6),

('Ain’t No Sunshine', 'Bill Withers', '02:04', 1971, 7),
('Adorn', 'Miguel', '03:14', 2012, 7),
('No Diggity', 'Blackstreet ft. Dr. Dre', '05:06', 1996, 7),
('Superstition', 'Stevie Wonder', '04:26', 1972, 7),
('Crazy in Love', 'Beyoncé ft. Jay-Z', '03:56', 2003, 7),
('Ordinary People', 'John Legend', '04:41', 2004, 7),
('Say My Name', 'Destiny’s Child', '04:31', 1999, 7),
('Killing Me Softly With His Song', 'Fugees', '04:58', 1996, 7),
('If I Ain’t Got You', 'Alicia Keys', '03:48', 2003, 7),
('Let’s Get It On', 'Marvin Gaye', '04:02', 1973, 7),

('Country Roads', 'John Denver', '03:08', 1971, 8),
('Take Me Home, 8', 'Israel Kamakawiwo ole', '04:29', 2001, 8),
('On The Road Again', 'Willie Nelson', '02:33', 1980, 8),
('Wide Open Spaces', 'Dixie Chicks', '03:42', 1998, 8),
('Jolene', 'Dolly Parton', '02:41', 1973, 8),
('The Gambler', 'Kenny Rogers', '03:31', 1978, 8),
('I Walk the Line', 'Johnny Cash', '02:43', 1956, 8),
('Wagon Wheel', 'Old Crow Medicine Show', '03:56', 2004, 8),
('Tennessee Whiskey', 'Chris Stapleton', '04:53', 2015, 8),
('Amarillo By Morning', 'George Strait', '02:54', 1983, 8),

('Take Five', 'Dave Brubeck', '05:24', 1959, 9),
('So What', 'Miles Davis', '09:22', 1959, 9),
('Fly Me to the Moon', 'Frank Sinatra', '02:30', 1964, 9),
('Feeling Good', 'Nina Simone', '02:53', 1965, 9),
('Watermelon Man', 'Herbie Hancock', '07:09', 1962, 9),
('My Favorite Things', 'John Coltrane', '13:41', 1961, 9),
('Summertime', 'Ella Fitzgerald', '04:59', 1968, 9),
('Girl from Ipanema', 'Stan Getz & João Gilberto', '05:24', 1964, 9),
('Take the A Train', 'Duke Ellington', '04:38', 1941, 9),
('Autumn Leaves', 'Cannonball Adderley', '10:58', 1958, 9),

('One Love', 'Bob Marley & The Wailers', '02:51', 1977, 10),
('Three Little Birds', 'Bob Marley & The Wailers', '03:01', 1977, 10),
('Redemption Song', 'Bob Marley', '03:50', 1980, 10),
('No Woman, No Cry', 'Bob Marley & The Wailers', '07:08', 1974, 10),
('Is This Love', 'Bob Marley & The Wailers', '03:52', 1978, 10),
('Buffalo Soldier', 'Bob Marley & The Wailers', '04:17', 1983, 10),
('Could You Be Loved', 'Bob Marley & The Wailers', '03:56', 1980, 10),
('Stir It Up', 'Bob Marley & The Wailers', '05:33', 1973, 10),
('Jamming', 'Bob Marley & The Wailers', '03:31', 1977, 10),
('Get Up, Stand Up', 'Bob Marley & The Wailers', '03:17', 1973, 10),

('Moonlight Sonata', 'Ludwig van Beethoven', '14:57', 1801, 11),
('Eine kleine Nachtmusik', 'Wolfgang Amadeus Mozart', '17:23', 1787, 11),
('Symphony No. 5', 'Ludwig van Beethoven', '31:28', 1808, 11),
('Canon in D', 'Johann Pachelbel', '06:03', 1680, 11),
('Clair de Lune', 'Claude Debussy', '05:09', 1890, 11),
('The Four Seasons', 'Antonio Vivaldi', '38:00', 1723, 11),
('Piano Sonata No. 14 "Moonlight"', 'Ludwig van Beethoven', '15:00', 1801, 11),
('Ride of the Valkyries', 'Richard Wagner', '05:19', 1856, 11),
('Symphony No. 9 "Choral"', 'Ludwig van Beethoven', '67:25', 1824, 11),
('Carmen Suite No. 1', 'Georges Bizet', '19:02', 1875, 11),

('Master of Puppets', 'Metallica', '08:36', 1986, 12),
('Paranoid', 'Black Sabbath', '02:49', 1970, 12),
('Ace of Spades', 'Motörhead', '02:49', 1980, 12),
('Run to the Hills', 'Iron Maiden', '03:54', 1982, 12),
('Breaking the Law', 'Judas Priest', '02:35', 1980, 12),
('Crazy Train', 'Ozzy Osbourne', '04:56', 1980, 12),
('The Trooper', 'Iron Maiden', '04:12', 1983, 12),
('Raining Blood', 'Slayer', '04:16', 1986, 12),
('War Pigs', 'Black Sabbath', '07:58', 1970, 12),
('Number of the Beast', 'Iron Maiden', '04:50', 1982, 12),

('Superstition', 'Stevie Wonder', '04:26', 1972, 13),
('Play That Funky Music', 'Wild Cherry', '05:00', 1976, 13),
('Uptown Funk', 'Mark Ronson ft. Bruno Mars', '04:30', 2014, 13),
('Get Down On It', 'Kool & The Gang', '04:53', 1981, 13),
('Brick House', 'The Commodores', '03:36', 1977, 13),
('Boogie Wonderland', 'Earth, Wind & Fire', '04:48', 1979, 13),
('Give Up the Funk (Tear the Roof off the Sucker)', 'Parliament', '05:46', 1976, 13),
('Jungle Boogie', 'Kool & The Gang', '03:04', 1973, 13),
('Le Freak', 'Chic', '05:23', 1978, 13),
('Got to Be Real', 'Cheryl Lynn', '03:47', 1978, 13),

('Fast Car', 'Tracy Chapman', '04:57', 1988, 14),
('Blackbird', 'The Beatles', '02:18', 1968, 14),
('Hallelujah', 'Jeff Buckley', '06:53', 1994, 14),
('I Will Follow You into the Dark', 'Death Cab for Cutie', '03:09', 2005, 14),
('The A Team', 'Ed Sheeran', '04:18', 2011, 14),
('Fire and Rain', 'James Taylor', '03:20', 1970, 14),
('Wonderwall', 'Oasis', '04:18', 1995, 14),
('Skinny Love', 'Bon Iver', '03:59', 2007, 14),
('Chasing Cars', 'Snow Patrol', '04:28', 2006, 14),
('Someone Like You', 'Adele', '04:45', 2011, 14),

('Sweet Child O’ Mine', 'Guns N’ Roses', '05:55', 1987, 15),
('Take On Me', 'a-ha', '03:46', 1984, 15),
('Billie Jean', 'Michael Jackson', '04:54', 1982, 15),
('Livin’ On a Prayer', 'Bon Jovi', '04:10', 1986, 15),
('Eye of the Tiger', 'Survivor', '04:03', 1982, 15),
('Don’t Stop Believin’', 'Journey', '04:10', 1981, 15),
('Every Breath You Take', 'The Police', '04:13', 1983, 15),
('Like a Prayer', 'Madonna', '05:41', 1989, 15),
('I Wanna Dance with Somebody', 'Whitney Houston', '04:50', 1987, 15),
('Africa', 'Toto', '04:55', 1982, 15)
;

-- Inserindo dados na tabela pasta_ruidos
INSERT INTO pasta_ruidos (nome_ruido, duracao, playlist, frequencia, loop_) VALUES
('Ruído 1', '00:01:00', 2, 440, true),
('Ruído 2', '00:00:45', 2, 550, false),
('Ruído 3', '00:01:30', 3, 660, false),
('Ruído 4', '00:02:00', 3, 770, true),
('Ruído 5', '00:00:45', 4, 880, false),
('Ruído 6', '00:01:15', 4, 990, true);





    
