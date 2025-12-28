import random
import openpyxl
import time
from twilio.rest import Client
from tabulate import tabulate

# Define normal heart rate range
NORMAL_HEART_RATE_RANGE = (60, 100)

# Twilio configuration
ACCOUNT_SID = 'SSID'
AUTH_TOKEN = 'YOUR_TOKEN'
TWILIO_PHONE_NUMBER = 'YOUR_PHONE_NUMBER'
TWILIO_CLIENT = Client(ACCOUNT_SID, AUTH_TOKEN)

# Read patient data from Excel file
def read_patient_data_from_excel(file_path):
    wb = openpyxl.load_workbook(filename=file_path)
    sheet = wb.active
    data = []
    for row in sheet.iter_rows(min_row=2, values_only=True):
        name, age, mobile = row[:3]
        data.append({'Name': name, 'Age': age, 'Mobile Number': '+91' + str(mobile)})
    return data

# Define function to simulate heart rate
def simulate_heart_rate(heart_rate):
    # Fluctuate heart rate randomly once in 100 times
    if random.randint(1, 100) == 1:
        heart_rate += random.randint(-20, 20)
    return heart_rate

# Define function to check heart rate and generate warnings
def check_heart_rate_cluster(cluster_name, cluster):
    rows = []
    for value in cluster:
        name = value['Name']
        age = int(value['Age'])
        mobile = value['Mobile Number']
        heart_rate = simulate_heart_rate(random.randint(NORMAL_HEART_RATE_RANGE[0], NORMAL_HEART_RATE_RANGE[1]))
        status = 'Normal'  # default status
        if heart_rate < NORMAL_HEART_RATE_RANGE[0]:
            message = f"Warning: {name}, your heart rate is low ({heart_rate})"
            send_sms(mobile, message)
            status = 'Low'
        elif heart_rate > NORMAL_HEART_RATE_RANGE[1]:
            message = f"Warning: {name}, your heart rate is high ({heart_rate})"
            send_sms(mobile, message)
            status = 'High'
        rows.append([cluster_name, name, age, mobile, heart_rate, status])
    return rows

# Define function to send SMS
def send_sms(to_number, message):
    try:
        message = TWILIO_CLIENT.messages.create(to=to_number, from_=TWILIO_PHONE_NUMBER, body=message)
        print(f"Sent SMS to {to_number} with Message SID: {message.sid}")
    except Exception as e:
        print(f"Failed to send SMS to {to_number}: {str(e)}")

# Main function
def main():
    # Read patient data from Excel file
    patient_data = read_patient_data_from_excel("heartdata.xlsx")

    # Shuffle the patient data
    random.shuffle(patient_data)

    # Divide patients into clusters with at least 6 patients in each cluster
    num_clusters = len(patient_data) // 6
    remaining_patients = len(patient_data) % 6

    clusters = [patient_data[i * 6: (i + 1) * 6] for i in range(num_clusters)]

    if remaining_patients > 0:
        last_cluster = patient_data[num_clusters * 6:]
        random.shuffle(last_cluster)
        clusters.append(last_cluster[:remaining_patients])

    # Assign random values to clusters
    values = [i + 1 for i in range(len(clusters))]
    random.shuffle(values)

    # Display patient name, age, mobile number, and heart rate every second for patients in each cluster
    while True:
        all_results = []
        for i, cluster in enumerate(clusters):
            cluster_name = f"Cluster {values[i]}"
            cluster_results = check_heart_rate_cluster(cluster_name, cluster)
            all_results.extend(cluster_results)

        # Prepare data for table display
        headers = ["Cluster", "Name", "Age", "Mobile Number", "Heart Rate", "Status"]
        data = [[row[0], row[1], row[2], row[3], row[4], row[5]] for row in all_results]

        # Print patient data in a table
        print(tabulate(data, headers=headers, tablefmt="grid"))

        # Wait for 1 second before displaying data for the next set of patients
        time.sleep(1)


if __name__ == '__main__':
    main()
